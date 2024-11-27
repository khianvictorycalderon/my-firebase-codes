import { initializeApp } from 'firebase/app';
import { getDatabase, ref, remove, set, update, get, child, onValue } from 'firebase/database';
import { useEffect, useState } from 'react';

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

const app = initializeApp(firebaseConfig);
const realtime_db = getDatabase(app);

interface Data {
  [key: string]: any;
}

// rt functions, rt_ means realtime
// Create / Update Data
const rt_write = (path: string, data: Data, isMerge: boolean) => {
  const dbRef = ref(realtime_db, path);
  if (isMerge) {
    update(dbRef, data)
  } else {
    set(dbRef, data)
  }
};

// Read Only On Request (Specify the field)
const rt_read = async (path: string, field: string): Promise<any> => {
  const dbRef = ref(realtime_db);
  try {
    const snapshot = await get(child(dbRef, `${path}/${field}`));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Read Data Always (Specify the field)
const rt_reading = (path: string, field: string, callback?: (data: any) => void) => {
  const dbRef = ref(realtime_db, `${path}/${field}`);
  const unsubscribe = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (callback) {
        callback(data);
      }
    } else {
      if (callback) {
        callback(null);
      }
    }
  });
  return unsubscribe;
};

// Delete Data
const rt_delete = (path: string) => {
  const dbRef = ref(realtime_db, path);
  remove(dbRef)
};

// Usages:
export default function App() {
  // Create Data / Update
  useEffect(() => {
    rt_write("users/user1",{name:"Jario",age:17,desc:"This is a long description"},false);
  },[]);
  //---------------------------

  // Read Data on Request
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      const fetchedName = await rt_read("users/user1", "name");
      setName(fetchedName);
    };
    fetchData();
  }, []);
  //---------------------------

  // Read Data Always
  const [desc, setDesc] = useState<string | null>(null);
  useEffect(() => {
    const unsubscribe = rt_reading("users/user1", "desc", (data) => {
      setDesc(data);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  //---------------------------

  // Delete Data
  const handleDeleteData = () => {
    rt_delete("users/user1"); // Deletes data at the path "users/user1"
  };
  //---------------------------

  return (
    <>
     <h1>Read Data on Request: <u>{name ? name : "Loading..."}</u></h1>
     <h1>Read Data Always: <u>{desc ? desc : "Loading..."}</u></h1>
     <button onClick={handleDeleteData}>Delete Data</button>
    </>
  )
}