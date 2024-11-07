import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/protection/ProtectedRoute'; // Komponentas, skirtas apsaugoti tam tikrus maršrutus
import Login from './components/pages/Login'; // Prisijungimo puslapis
import Register from './components/pages/Register'; // Registracijos puslapis
import Profile from './components/pages/Profile'; // Naudotojo profilio puslapis
import AllUsers from './components/pages/AllUsers'; // Visi naudotojai
import Conversations from './components/pages/Conversations'; // Pokalbių sąrašas
import EditUser from './components/pages/EditUser'; // Naudotojo redagavimo puslapis
import UserPage from './components/pages/UserPage'; // Atskiro naudotojo puslapis
import ChatPage from './components/pages/ChatPage'; // Konkretaus pokalbio puslapis
// outlets
import BaseOutlet from './components/outlets/Baseoutlet'; // Bazinis išėjimo komponentas, naudojamas apsaugotiems maršrutams

// Pagrindinis aplikacijos komponentas
const App = () => {
   const isAuthenticated = localStorage.getItem('user'); // Tikrina, ar naudotojas prisijungęs

   return (
    <Routes>
      {/* Pagrindinis maršrutas. Jei naudotojas prisijungęs, nukreipia į profilį; jei ne – į prisijungimo puslapį */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/profile" /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login />} /> {/* Prisijungimo puslapio maršrutas */}
      <Route path="/register" element={<Register />} /> {/* Registracijos puslapio maršrutas */}

      {/* Apsaugoti maršrutai, pasiekiami tik prisijungusiems naudotojams */}
      <Route 
         path=''
         element={
         <ProtectedRoute>
              <BaseOutlet/>
           </ProtectedRoute>}>
         <Route path="/profile" element={<Profile />} /> {/* Naudotojo profilio puslapis */}
         <Route path="/users" element={<AllUsers />} /> {/* Visų naudotojų puslapis */}
         <Route path="/user/:id" element={<UserPage />} /> {/* Konkretaus naudotojo puslapis pagal ID */}
         <Route path="/edit-user/:id" element={<EditUser />} /> {/* Naudotojo redagavimo puslapis pagal ID */}
         <Route path="/conversations" element={<Conversations />} /> {/* Pokalbių sąrašas */}
         <Route path="/chat/:conversationId" element={<ChatPage />} /> {/* Konkretaus pokalbio puslapis pagal pokalbio ID */}
      </Route>
    </Routes>
  )
}

export default App;
