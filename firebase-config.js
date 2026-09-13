<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAjvcXz7bBsQIou4Y8Du7mg8MGecVZgSdA",
    authDomain: "aiservice-cb4a7.firebaseapp.com",
    projectId: "aiservice-cb4a7",
    storageBucket: "aiservice-cb4a7.firebasestorage.app",
    messagingSenderId: "636018433520",
    appId: "1:636018433520:web:34ba25521a6e1d9b8b1135",
    measurementId: "G-GL700QQGK3"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
