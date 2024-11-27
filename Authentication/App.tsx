import { useEffect, useState } from "react";
import { fs_write, fs_reading, fs_delete, firebaseConfig } from "./firebase_crud";

// Authentication
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth'
import { Timestamp } from "firebase/firestore";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// ------------------------------

/*

 // Firestore Security Rules

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Rule for the `users` collection
    match /users/{userId} {
      
      // Allow read access if the user is authenticated and is accessing their own document
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow write access if the user is authenticated and is accessing their own document
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Optional: Restrict specific fields to be updated by the user
      // Example: Allow updates only to specific fields
      allow update: if request.auth != null && request.auth.uid == userId &&
                      request.resource.data.keys().hasOnly(['FirstName', 'MiddleName', 'LastName', 'BirthDate', 'Email', 'AccountDateCreation']);
    }
  }
}

*/

/*
 user Properties:
 - accessToken
 - auth {}
 - displayName
 - email
 - emailVerified
 - isAnonymous
 - metedata {}
 - phoneNumber
 - photoURL
 - proActiveRefresh {}
 - providerData {[]}
 - providerId
 - reloadListener
 - reloadUserInfo {}
 - stsTokenManager {}
 - tenantId
 - uid // User Id
*/

interface UserData {
  FirstName: string;
  MiddleName: string;
  LastName: string;
  BirthDate: string;
  Email: string;
  AccountDateCreation: string;
}

interface EditMode {
  FirstName: boolean;
  MiddleName: boolean;
  LastName: boolean;
  BirthDate: boolean;
  Email: boolean;
  AccountDateCreation: boolean;
}

interface EditValue {
  FirstName: string;
  MiddleName: string;
  LastName: string;
  BirthDate: string;
  Email: string;
  AccountDateCreation: string;
}

export default function App() {
  const refresh = () => {
    window.location.href = "";
  }
  const [page, setPage] = useState<string>("login");
  
  // Login Credentials
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoginHasError, setLoginHasError] = useState<boolean>(false);
  
  // Register Credentials
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regConfirmPass, setRegConfirmPass] = useState<string>("");
  const [regError, setRegError] = useState<string>("");
  const [regHasError, setRegHasError] = useState<boolean>(false);
  // Register Personal Info
  const [regFirstName, setRegFirstName] = useState<string>("");
  const [regMiddleName, setRegMiddleName] = useState<string>("");
  const [regLastName, setRegLastName] = useState<string>("");
  const [regBirthDate, setRegBirthDate] = useState<string>("");

  // Read Displayed Data
  const [userData, setUserData] = useState<UserData>({
    FirstName: "",
    MiddleName: "",
    LastName: "",
    BirthDate: "",
    Email: "",
    AccountDateCreation: ""
  });

  const [loading, setLoading] = useState<Partial<Record<keyof UserData, boolean>>>({
    FirstName: true,
    MiddleName: true,
    LastName: true,
    BirthDate: true,
    Email: true,
    AccountDateCreation: true
  });

  const [editMode, setEditMode] = useState<EditMode>({
    FirstName: false,
    MiddleName: false,
    LastName: false,
    BirthDate: false,
    Email: false,
    AccountDateCreation: false
  });

  const [editValue, setEditValue] = useState<EditValue>({
    FirstName: "",
    MiddleName: "",
    LastName: "",
    BirthDate: "",
    Email: "",
    AccountDateCreation: ""
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;

      const unsubscribeFirstName = fs_reading(`users/${userId}`, "FirstName", (firstName) => {
        setUserData(prevState => ({ ...prevState, FirstName: firstName || "" }));
        setEditValue(prevState => ({ ...prevState, FirstName: firstName || "" }));
        setLoading(prevState => ({ ...prevState, FirstName: false }));
      });

      const unsubscribeMiddleName = fs_reading(`users/${userId}`, "MiddleName", (middleName) => {
        setUserData(prevState => ({ ...prevState, MiddleName: middleName || "" }));
        setEditValue(prevState => ({ ...prevState, MiddleName: middleName || "" }));
        setLoading(prevState => ({ ...prevState, MiddleName: false }));
      });

      const unsubscribeLastName = fs_reading(`users/${userId}`, "LastName", (lastName) => {
        setUserData(prevState => ({ ...prevState, LastName: lastName || "" }));
        setEditValue(prevState => ({ ...prevState, LastName: lastName || "" }));
        setLoading(prevState => ({ ...prevState, LastName: false }));
      });

      const unsubscribeBirthDate = fs_reading(`users/${userId}`, "BirthDate", (birthDate) => {
        setUserData(prevState => ({ ...prevState, BirthDate: birthDate || "" }));
        setEditValue(prevState => ({ ...prevState, BirthDate: birthDate || "" }));
        setLoading(prevState => ({ ...prevState, BirthDate: false }));
      });

      return () => {
        unsubscribeFirstName();
        unsubscribeMiddleName();
        unsubscribeLastName();
        unsubscribeBirthDate();
      };
    }
  }, [auth.currentUser]);

  const handleEdit = (field: keyof UserData) => {
    setEditMode(prevState => ({ ...prevState, [field]: true }));
  };

  const handleSave = async (field: keyof UserData) => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      await fs_write(`users/${userId}`, { [field]: editValue[field] }, true);
      setUserData(prevState => ({ ...prevState, [field]: editValue[field] }));
      setEditMode(prevState => ({ ...prevState, [field]: false }));
    }
  };

  const handleChange = (field: keyof EditValue, value: string) => {
    setEditValue(prevState => ({ ...prevState, [field]: value }));
  };

  // Authentication
  // Attempt login
  const loginEmailPassword = async (email: string, password: string) => {
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        refresh();
      } catch (e: any) {
        setLoginHasError(true);
        if(
          e.message == "Firebase: Error (auth/invalid-email)." // Invalid Email
          || e.message == "Firebase: Error (auth/missing-password)." // Incorrect Password
          || e.message == "Firebase: Error (auth/missing-email)." // Empty Email
          || e.message == "Firebase: Error (auth/invalid-credential)." // Invalid Password
        ){
          setLoginError("Invalid Email or Password");
        } else if(
          e.message == "Firebase: Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later. (auth/too-many-requests)."
        ) {
          setLoginError("Too many login attempt, please try again later or contact the developer.");
        } else {
          setLoginError(e.message);
        }
      }
    }
  };
  // Sign Out User
  const logOut = async () => {
    signOut(auth);
    refresh();
  }
  // Delete Account
  const deleteAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await fs_delete(`users/${user.uid}`);
        await deleteUser(user);
        alert("Account successfully deleted.");
        setPage("login");
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          alert("Please log in again to delete your account.");
        } else {
          alert(`Failed to delete account: ${error.message}`);
        }
      }
    } else {
      alert("No user is currently logged in.");
    }
  };
  // User Create Account
  const registerEmailPassword = async (email: string, password: string, confirmpassword: string) => {
    if (email && password && confirmpassword) {
      // Validation first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(email)) {
        setRegError("Invalid Email.");
        setRegHasError(true);
        return;
      }
      if (password !== confirmpassword) {
        setRegError("Password does not match.");
        setRegHasError(true);
        return;
      }
      // If passed in the validation
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        const DataToBeWritten = {
          FirstName: regFirstName,
          MiddleName: regMiddleName,
          LastName: regLastName,
          BirthDate: regBirthDate,
          Email: regEmail,
          AccountDateCreation: Timestamp.now()
        };
        await fs_write(`users/${userId}`, DataToBeWritten, true);
        setRegHasError(false);
        setRegError("");
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          setRegError("Email is already in use.");
        } else if (e.code === 'auth/invalid-email') {
          setRegError("Invalid email format.");
        } else if (e.code === 'auth/weak-password') {
          setRegError("Password is too weak. Please choose a stronger password.");
        } else {
          setRegError("Registration failed. Please try again.");
        }
        setRegHasError(true);
      }
    } else {
      setRegError("Please fill in all fields.");
      setRegHasError(true);
    }
  };
  // Clears the login and register form every time it is switched
  useEffect(() => {
    setLoginHasError(false);
    setLoginEmail("");
    setLoginPassword("");
    setRegHasError(false);
    setRegError("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirmPass("");
    setRegFirstName("");
    setRegMiddleName("");
    setRegLastName("");
    setRegBirthDate("");
  },[page])
  useEffect(() => {
    // monitors if user is logged in or not
    onAuthStateChanged(auth, user => {
      if(user) {
        setPage("loggedin");
      } else {
        setPage("login");

        // Clears Login
        setLoginHasError(false);
        setLoginEmail("");
        setLoginPassword("");

        // Clears Register
        setRegHasError(false);
        setRegError("");
        setRegEmail("");
        setRegPassword("");
        setRegConfirmPass("");
        setRegFirstName("");
        setRegMiddleName("");
        setRegLastName("");
        setRegBirthDate("");
      }
    })
  },[])
  //---------------------------------------
  return(
    <>
      <br/>
      <div className="center-h fs-6">
        Register & Login System Template <br/>by <a href="https://khianvictorycalderon.github.io/">Khian Victory D. Calderon</a> <br/> using Firebase Authentication & Firebase Firestore
      </div>
      <br/>
      {page == "login" && 
      <div className="center-h fs-6 w-70 m-auto container form-box">
        Login
        <form onSubmit={(e) => {e.preventDefault(); loginEmailPassword(loginEmail, loginPassword)}}>
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">Email: </label>
            <div className="col-sm-10">
              <input type="text" onChange={(e) => {setLoginEmail(e.target.value)}} value={loginEmail} className="form-control fs-6" required/>
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">Password: </label>
            <div className="col-sm-10">
              <input type="password" onChange={(e) => {setLoginPassword(e.target.value)}} value={loginPassword} className="form-control fs-6" required/>
            </div>
          </div>
          {isLoginHasError &&
            <>
              <span className="error-message">{loginError}</span>
              <br/>
            </>
          }
          <input id="log_submit" type="submit" className="btn btn-primary" value="Login"/>
        </form>
        No Account? <a onClick={() => setPage("register")} className="link">Create One</a>
      </div>}
      {page == "register" &&
      <div className="center-h fs-6 w-70 m-auto container form-box">
        Register
        <hr/>
        <form onSubmit={(e) => {e.preventDefault(); registerEmailPassword(regEmail, regPassword, regConfirmPass)}}>
          Personal Info
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">First Name: </label>
            <div className="col-sm-10">
              <input type="text" onChange={(e) => {setRegFirstName(e.target.value)}} value={regFirstName} className="form-control fs-6" required/>
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">Middle Name: </label>
            <div className="col-sm-10">
              <input type="text" onChange={(e) => {setRegMiddleName(e.target.value)}} value={regMiddleName} className="form-control fs-6" required/>
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">Last Name: </label>
            <div className="col-sm-10">
              <input type="text"onChange={(e) => {setRegLastName(e.target.value)}} value={regLastName} className="form-control fs-6" required/>
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">Birth Date: </label>
            <div className="col-sm-10">
              <input type="date"onChange={(e) => {setRegBirthDate(e.target.value)}} value={regBirthDate} className="form-control fs-6" required/>
            </div>
          </div>
          <br/>
          <hr/>
          Account Info<br/>
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">Email: </label>
            <div className="col-sm-10">
              <input type="text" onChange={(e) => {setRegEmail(e.target.value)}} value={regEmail} className="form-control fs-6" required/>
            </div>
          <i>Email cannot be changed after account creation.</i>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">Password: </label>
            <div className="col-sm-10">
              <input type="password" onChange={(e) => {setRegPassword(e.target.value)}} value={regPassword} className="form-control fs-6" required/>
            </div>
          </div>
          <div className="mb-3 row">
            <label className="col-sm-2 col-form-label">Confirm: </label>
            <div className="col-sm-10">
              <input type="password" onChange={(e) => {setRegConfirmPass(e.target.value)}} value={regConfirmPass} className="form-control fs-6" required/>
            </div>
          </div>
          {regHasError &&
            <>
             <span className="error-message">{regError}</span>
             <br/>
            </>
          }
          <input type="submit" className="btn btn-primary" value="Register"/>
        </form>
        Already have an Account? <a onClick={() => (setPage("login"))} className="link">Sign in</a>
      </div>
      }
      {page == "loggedin" &&
        <div className="center-h fs-6 w-70 m-auto container form-box">
        <br />
        Welcome {loading.FirstName ? "Loading..." : userData.FirstName}
        <br /><br />
        <h3>Personal Info</h3>
        <div>
          <strong>First Name: </strong>
          {loading.FirstName ? (
            "Loading..."
          ) : editMode.FirstName ? (
            <input
              type="text"
              value={editValue.FirstName}
              onChange={(e) => handleChange('FirstName', e.target.value)}
            />
          ) : (
            <u>{userData.FirstName}</u>
          )}
          {" "}
          {editMode.FirstName ? (
            <>
              <button className="btn btn-primary p-1" onClick={() => handleSave('FirstName')}>Save</button>
              <button className="btn btn-secondary p-1" onClick={() => setEditMode(prevState => ({ ...prevState, FirstName: false }))}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary p-1" onClick={() => handleEdit('FirstName')}>Edit</button>
          )}
        </div>
        <br />
        <div>
          <strong>Middle Name: </strong>
          {loading.MiddleName ? (
            "Loading..."
          ) : editMode.MiddleName ? (
            <input
              type="text"
              value={editValue.MiddleName}
              onChange={(e) => handleChange('MiddleName', e.target.value)}
            />
          ) : (
            <u>{userData.MiddleName}</u>
          )}
          {" "}
          {editMode.MiddleName ? (
            <>
              <button className="btn btn-primary p-1" onClick={() => handleSave('MiddleName')}>Save</button>
              <button className="btn btn-secondary p-1" onClick={() => setEditMode(prevState => ({ ...prevState, MiddleName: false }))}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary p-1" onClick={() => handleEdit('MiddleName')}>Edit</button>
          )}
        </div>
        <br />
        <div>
          <strong>Last Name: </strong>
          {loading.LastName ? (
            "Loading..."
          ) : editMode.LastName ? (
            <input
              type="text"
              value={editValue.LastName}
              onChange={(e) => handleChange('LastName', e.target.value)}
            />
          ) : (
            <u>{userData.LastName}</u>
          )}
          {" "}
          {editMode.LastName ? (
            <>
              <button className="btn btn-primary p-1" onClick={() => handleSave('LastName')}>Save</button>
              <button className="btn btn-secondary p-1" onClick={() => setEditMode(prevState => ({ ...prevState, LastName: false }))}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary p-1" onClick={() => handleEdit('LastName')}>Edit</button>
          )}
        </div>
        <br />
        <div>
          <strong>Birth Date: </strong>
          {loading.BirthDate ? (
            "Loading..."
          ) : editMode.BirthDate ? (
            <input
              type="date"
              value={editValue.BirthDate}
              onChange={(e) => handleChange('BirthDate', e.target.value)}
            />
          ) : (
            <u>{userData.BirthDate}</u>
          )}
          {" "}
          {editMode.BirthDate ? (
            <>
              <button className="btn btn-primary p-1" onClick={() => handleSave('BirthDate')}>Save</button>
              <button className="btn btn-secondary p-1" onClick={() => setEditMode(prevState => ({ ...prevState, BirthDate: false }))}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary p-1" onClick={() => handleEdit('BirthDate')}>Edit</button>
          )}
        </div>
        <br />
        <button onClick={logOut} className="btn btn-primary">Logout</button>
        {" "}
        <button onClick={deleteAccount} className="btn btn-primary">Delete Account</button>
        <br /><br />
      </div>
      }
    </>
  )
}
