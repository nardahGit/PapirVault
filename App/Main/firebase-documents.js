import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
    initializeFirestore,
    getFirestore,
    collection,
    addDoc,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const config = window.PAPIRVAULT_FIREBASE_CONFIG;

const isValidFirebaseConfig = (value) => {
    if (!value) return false;

    const requiredFields = ["apiKey", "authDomain", "projectId", "appId"];
    return requiredFields.every((field) => typeof value[field] === "string" && value[field].trim().length > 0);
};

let auth = null;
let db = null;
let storage = null;
let appInstance = null;

if (isValidFirebaseConfig(config)) {
    const bucketFallback = config.storageBucket || `${config.projectId}.appspot.com`;
    const normalizedConfig = {
        ...config,
        storageBucket: bucketFallback
    };

    const app = getApps().length ? getApp() : initializeApp(normalizedConfig);
    appInstance = app;
    auth = getAuth(app);
    try {
        db = initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true,
            useFetchStreams: false
        });
    } catch {
        db = getFirestore(app);
    }
    storage = getStorage(app, `gs://${bucketFallback}`);
}

const withTimeout = (promise, ms, timeoutMessage) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(timeoutMessage)), ms);
        })
    ]);
};

const uniqueBuckets = () => {
    const list = [
        config?.storageBucket,
        config?.projectId ? `${config.projectId}.appspot.com` : "",
        config?.projectId ? `${config.projectId}.firebasestorage.app` : ""
    ].filter(Boolean);

    return [...new Set(list)];
};

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const toCodePrefix = (category = "DOC") => {
    const normalized = category.trim().toUpperCase();
    if (normalized.startsWith("HEALTH")) return "HLT";
    if (normalized.startsWith("INSURANCE")) return "INS";
    if (normalized.startsWith("RESIDENCE")) return "RES";
    if (normalized.startsWith("IDENTITY")) return "IDN";
    return normalized.slice(0, 3) || "DOC";
};

const generateVerificationCode = ({ category }) => {
    const year = new Date().getFullYear();
    return `${toCodePrefix(category)}-${year}-${randomCode()}`;
};

const createDocumentRecord = async ({
    documentId,
    clientUid,
    issuerUid,
    issuerName,
    title,
    category,
    verificationCode,
    expiryDate,
    issueDate,
    legalNote,
    file,
    fileUrl,
    uploadWarning
}) => {
    const payload = {
        id: documentId,
        ownerUid: clientUid.trim(),
        issuerUid: issuerUid || "",
        issuerName: issuerName || "Authorized Issuer",
        title: title.trim(),
        titleLower: title.trim().toLowerCase(),
        category: category.trim(),
        status: "Verified",
        verificationCode,
        qrPayload: `${window.PAPIRVAULT_PUBLIC_VERIFY_BASE_URL}?verify=1&doc=${encodeURIComponent(title.trim())}&issuer=${encodeURIComponent(issuerName || "Authorized Issuer")}&validUntil=${encodeURIComponent(expiryDate || "N/A")}&status=Verified&code=${encodeURIComponent(verificationCode)}`,
        issueDate: issueDate || "",
        expiryDate: expiryDate || "",
        legalNote: legalNote || "",
        fileName: file?.name || "",
        fileType: file?.type || "",
        fileSize: file?.size || 0,
        fileUrl: fileUrl || "",
        uploadWarning: uploadWarning || "",
        createdAt: serverTimestamp()
    };

    const docRef = doc(collection(db, "documents"), documentId);
    await withTimeout(
        setDoc(docRef, payload),
        12000,
        "Saving document record timed out."
    );

    try {
        await withTimeout(
            addDoc(collection(db, "notifications"), {
                uid: clientUid.trim(),
                type: "document",
                title: "New verified document uploaded",
                message: `${title.trim()} is now available in your vault.`,
                docId: documentId,
                isRead: false,
                createdAt: serverTimestamp()
            }),
            7000,
            "Saving notification timed out."
        );
    } catch {
    }

    return payload;
};

const registerIssuerDocumentWithoutFile = async ({
    title,
    category,
    clientUid,
    expiryDate,
    issueDate,
    legalNote,
    issuerName,
    issuerUid,
    warningMessage
}) => {
    if (!db) throw new Error("Firestore is not configured.");
    if (!title?.trim()) throw new Error("Please enter document type/title.");
    if (!category?.trim()) throw new Error("Please select a category.");
    if (!clientUid?.trim()) throw new Error("Please enter client UID.");

    const verificationCode = generateVerificationCode({ category });
    const documentId = doc(collection(db, "documents")).id;

    return createDocumentRecord({
        documentId,
        clientUid,
        issuerUid,
        issuerName,
        title,
        category,
        verificationCode,
        expiryDate,
        issueDate,
        legalNote,
        file: null,
        fileUrl: "",
        uploadWarning: warningMessage || "Stored without file due to storage issue."
    });
};

const uploadIssuerDocument = async ({
    file,
    title,
    category,
    clientUid,
    expiryDate,
    issueDate,
    legalNote,
    issuerName,
    issuerUid
}) => {
    if (!db || !storage) throw new Error("Firebase is not configured.");
    if (!file) throw new Error("Please choose a file.");
    if (!title?.trim()) throw new Error("Please enter document type/title.");
    if (!category?.trim()) throw new Error("Please select a category.");
    if (!clientUid?.trim()) throw new Error("Please enter client UID.");

    const verificationCode = generateVerificationCode({ category });
    const documentId = doc(collection(db, "documents")).id;

    const safeFileName = file.name.replace(/\s+/g, "_");
    const storagePath = `documents/${clientUid}/${documentId}/${safeFileName}`;

    let fileUrl = "";
    let lastUploadError = null;
    const bucketCandidates = uniqueBuckets();

    for (const bucketName of bucketCandidates) {
        try {
            const bucketStorage = getStorage(appInstance, `gs://${bucketName}`);
            const fileRef = ref(bucketStorage, storagePath);

            await withTimeout(
                uploadBytes(fileRef, file),
                20000,
                `Upload timed out for bucket ${bucketName}`
            );

            fileUrl = await withTimeout(
                getDownloadURL(fileRef),
                10000,
                `Could not fetch file URL from bucket ${bucketName}`
            );

            break;
        } catch (error) {
            lastUploadError = error;
        }
    }

    let uploadWarning = "";
    if (!fileUrl) {
        const reason = lastUploadError?.message || "Storage upload failed.";
        uploadWarning = `Storage upload unavailable: ${reason}`;
    }

    return createDocumentRecord({
        documentId,
        clientUid,
        issuerUid,
        issuerName,
        title,
        category,
        verificationCode,
        expiryDate,
        issueDate,
        legalNote,
        file,
        fileUrl,
        uploadWarning
    });
};

const listClientDocuments = async ({ clientUid }) => {
    if (!db || !clientUid?.trim()) return [];

    const q = query(collection(db, "documents"), where("ownerUid", "==", clientUid.trim()));
    const snapshot = await getDocs(q);

    const docs = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...entry.data()
    }));

    docs.sort((a, b) => {
        const aTime = a?.createdAt?.seconds || 0;
        const bTime = b?.createdAt?.seconds || 0;
        return bTime - aTime;
    });

    return docs;
};

const searchClientDocuments = async ({ clientUid, keyword }) => {
    const allDocs = await listClientDocuments({ clientUid });
    const term = (keyword || "").trim().toLowerCase();
    if (!term) return allDocs;

    return allDocs.filter((docItem) => {
        return (
            String(docItem.title || "").toLowerCase().includes(term) ||
            String(docItem.category || "").toLowerCase().includes(term) ||
            String(docItem.issuerName || "").toLowerCase().includes(term) ||
            String(docItem.verificationCode || "").toLowerCase().includes(term)
        );
    });
};

const onUserChanged = (callback) => {
    if (!auth || typeof callback !== "function") return () => {};
    return onAuthStateChanged(auth, callback);
};

window.PapirVaultDocs = {
    isReady: () => Boolean(auth && db && storage),
    onUserChanged,
    uploadIssuerDocument,
    registerIssuerDocumentWithoutFile,
    listClientDocuments,
    searchClientDocuments
};
