import { createContext, useReducer, useState, useEffect, ReactElement } from 'react';

type ChildProp = { children: ReactElement }; // Komponento vaiko tipas
export type UserType = {
    _id: string,
    username: string,
    profileImage: string,
    password: string
};
export type UserRegistrationType = {
  username: string;
  profileImage: string;
  password: string;
  passwordRepeat: string; // Tik naudojamas patikrinimui registracijos metu
};
export type ErrorOrSuccessReturn = {error?: string, success?: string};
export type UsersContextTypes = {
    users: UserType[], // Naudotojų sąrašas
    addNewUser: (user: UserRegistrationType ) => Promise<ErrorOrSuccessReturn>, // Pridėti naują naudotoją
    loggedInUser: UserType | null, // Prisijungęs naudotojas arba null
    logUserIn: (userLoginInfo: Pick<UserType, "username" | "password">) => Promise<ErrorOrSuccessReturn>, // Prisijungimas
    logout: () => void, // Atsijungimas
    editSpecificUser: (editedUser: Omit<UserType, "_id">, userId: string) => Promise<ErrorOrSuccessReturn>, // Redagavimas
    returnSpecificUser: (id: string) => UserType | undefined; // Specifinio naudotojo gavimas
};

type ReducerActionTypeVariations =
| { type: 'uploadData'; allData: UserType[] }
| { type: 'add'; data: UserType }   
| { type: 'editUser'; data: Omit<UserType, '_id'>; id: string };

// Reduktoriaus funkcija, skirta valdyti naudotojų būseną
const reducer = (state: UserType[], action: ReducerActionTypeVariations): UserType[] => {
    switch (action.type) {
        case "uploadData":
            return action.allData; // Įkelia visus duomenis
        case "add":
            return [...state, action.data]; // Prideda naują naudotoją
        case "editUser":
            return state.map(el => 
            el._id === action.id ? { ...el, ...action.data } : el); // Redaguoja naudotoją pagal ID
     default:
        return state;
    }     
};

// Sukuria kontekstą naudotojams
const UsersContext = createContext<UsersContextTypes | undefined>(undefined);

// Pagrindinis „UsersProvider“ komponentas
const UsersProvider = ({children}: ChildProp) => {
 
   const [users, dispatch] = useReducer(reducer, []); // Naudojame „useReducer“ naudotojų būsenai valdyti
   const [loggedInUser, setLoggedInUser] = useState<null | UserType>(null); // Valdo prisijungusį naudotoją
   
   // Funkcija, kuri prideda naują naudotoją į backend'ą ir atnaujina sąrašą
   const addNewUser = async (user: UserRegistrationType): Promise<ErrorOrSuccessReturn> => {
    try {
      console.log("Sending user data to backend:", user); // Pateikia naudotojo duomenis į backend'ą

      const res = await fetch(`/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      
      if (res.status === 409){ // Jei naudotojo vardas jau naudojamas
        const errorData = await res.json();
        return errorData;
      } 
      
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: 'add', data });
        setLoggedInUser(data);
        localStorage.setItem('loggedInUser', JSON.stringify(data)); // Išsaugo į localStorage

        // Atnaujina naudotojų sąrašą
        fetch(`/api/users`)
        .then(res => res.json())
        .then(data => dispatch({ type: "uploadData", allData: data }))
        .catch(err => console.error(err));  

        return { success: 'Registration successful' };
    } else {
        const errorData = await res.json();
        return { error: errorData.error || 'Failed to register user.' };
    }
} catch (err) {
    console.error("Error in addNewUser:", err);
    return { error: 'Server error. Please try again later.' };
}
};
     
  // Prisijungimo funkcija
  const logUserIn = async (userLoginInfo: Pick<UserType, 'username' | 'password'>): Promise<ErrorOrSuccessReturn> => {
    try {
      console.log(userLoginInfo);
      const res = await fetch(`/api/users/login`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(userLoginInfo)
      });
      
      if(res.status === 401){ // Netinkami prisijungimo duomenys
        return await res.json();
       } else if (res.ok){ // Sėkmingas prisijungimas
        const data = await res.json();
        setLoggedInUser(data);
        localStorage.setItem('loggedInUser', JSON.stringify(data));
        return { success: 'Login success, you will be directed to your profile page.' }
      }else {
        return{ error: "Unexpected server response."};
      }
    } catch(err) {
      console.error(err);
      return { error: 'A server error occurred while trying to connect. Please try again later.' };
    }
  }  

  // Atsijungimo funkcija
  const logout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('loggedInUser');
  };

  // Naudotojo redagavimo funkcija
  const editSpecificUser = async (editedUser: Partial<UserType>, userId: string): Promise<ErrorOrSuccessReturn> => {
    try {
      const localStorageInfo = localStorage.getItem('loggedInUser');
      let currentUser: UserType | null = null;
  
      if (localStorageInfo) {
        currentUser = JSON.parse(localStorageInfo) as UserType;
      }
  
      if (!currentUser || currentUser._id !== userId) {
        return { error: "User not found in localStorage or mismatch with userId." };
      }
  
      const updatedUser: Partial<UserType> = {
        username: editedUser.username ?? currentUser.username,
        profileImage: editedUser.profileImage ?? currentUser.profileImage,
      };
      
      if (editedUser.password && editedUser.password.trim() !== "") {
          updatedUser.password = editedUser.password;
      }
  
      const res = await fetch(`/api/edit-user/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
  
      if (!res.ok) return { error: "Failed to update user." };
  
      setLoggedInUser({...currentUser, ...updatedUser} as UserType);
      localStorage.setItem('loggedInUser', JSON.stringify({...currentUser, ...updatedUser}));
  
      return { success: "User updated successfully." };
    } catch (err) {
      console.error("Error updating user:", err);
      return { error: "Server error. Please try again later." };
    }
  };

  // Funkcija, kuri grąžina naudotoją pagal ID
  const returnSpecificUser = (id: string): UserType | undefined => users.find(user => user._id === id);

   useEffect(() => {
    const fetchUsers = async () => {
      try {
       const res = await fetch(`/api/users`);
       const data = await res.json();
       dispatch({type: "uploadData", allData: data});
      } catch (err) {
        console.error(err);
      }
    };
    
    const autoLogin = async () => {
    const localStorageInfo = localStorage.getItem('loggedInUser');
    if(localStorageInfo) {
      const userInfo = JSON.parse(localStorageInfo) as UserType ;
      const result = await logUserIn({ username: userInfo.username, password: userInfo.password });
      if (result.success) {
      setLoggedInUser(userInfo);
      }
    }
  };
  fetchUsers();
  autoLogin();
}, []) ;   

     return (
        <UsersContext.Provider
           value={{
             users,
             loggedInUser,
             addNewUser,
             logUserIn,
             logout,
             editSpecificUser, 
             returnSpecificUser
           }}
       >
        {children}
       </UsersContext.Provider>
)
}

export { UsersProvider };
export default UsersContext;
