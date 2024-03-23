import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


  // Your Firebase configuration details
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDo2p5wfbHwOYE7e1-bwnDkPoejyn2-0LI",
    authDomain: "lost-found-78016.firebaseapp.com",
    projectId: "lost-found-78016",
    storageBucket: "lost-found-78016.appspot.com",
    messagingSenderId: "1007936544105",
    appId: "1:1007936544105:web:63919e5880413e2cf2f1f8",
    measurementId: "G-Q7Z4PMT38Q"
  };


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const Image=db.collection("Image")

export { db,Image };