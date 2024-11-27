import { useState, useRef } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { deleteObject, getStorage, ref, uploadBytesResumable, getDownloadURL, UploadTask, UploadTaskSnapshot } from 'firebase/storage';

// your custom firebase configuration here
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const cls_storage = getStorage(app);

// Create File
const cls_upload = (path: string, file: File): Promise<string> => {
  const storageRef = ref(cls_storage, path);
  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);
  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log(`Upload is ${progress}% done`);
      },
      (error: Error) => {
        console.error(error);
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL: string) => {
          resolve(downloadURL);
        });
      }
    );
  });
};

// Download File
const cls_download = (path: string): Promise<string> => {
  const storageRef = ref(cls_storage, path);
  return getDownloadURL(storageRef);
};

// Delete File
const cls_delete = (path: string): Promise<void> => {
  const fileRef = ref(cls_storage, path);
  return deleteObject(fileRef)
};


/*
  For displaying the uploaded file, you can use the absolute URL.
  No need to create a custom function for reading the data since it also act as Base64
  for example:

  const imagelink = "https://yourproject.appspot.com/path"
  <img src={imagelink} />
*/

export default function App() {
  // Usages:

  // Create File (Upload)
  const [file, setFile] = useState<File | null>(null);
  const [progress] = useState<number>(0);
  const [url, setUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleUpload = async () => {
    if (!file) return;
    const filePath = `files/${file.name}`;
    try {
      const downloadURL = await cls_upload(filePath, file);
      setUrl(downloadURL);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  //---------------------------

  // Create File Local (Download)
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const handleDownload = async () => {
    const filePath = 'files/donation.zip'; // Replace with the actual path
    try {
      const url = await cls_download(filePath);
      setDownloadUrl(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  //---------------------------

  // Delete File (Erase)
  const handleFileDelete = () => {
    cls_delete("files/donation.zip");
  }
  //---------------------------

  return (
    <>
     <div>
      <h1>Upload a File</h1>
      <input
        type="file"
        onChange={handleChange}
        ref={fileInputRef}
      />
      <button onClick={handleUpload}>Upload</button>
      <progress value={progress} max="100" />
      {url && <img src={url} alt="Uploaded file" style={{ marginTop: '20px', maxWidth: '500px' }} />}
     </div>

     <hr/>

     <h2>Download a File</h2>
      <button onClick={handleDownload}>Download</button>
      {downloadUrl && (
        <div>
          <p>Download URL: <a href={downloadUrl} target="_blank" rel="noopener noreferrer">{downloadUrl}</a></p>
        </div>
      )}

      <hr/>

      <h2>Delete File:</h2>
      <button onClick={handleFileDelete}>Delete</button>
    </>
  )
}