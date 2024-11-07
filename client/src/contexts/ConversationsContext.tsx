// Importuoja reikalingus „React“ hook'us ir konteksto kūrimo funkcijas.
import { useReducer, useEffect, createContext, ReactElement, useState } from 'react';
import { UserType } from "../contexts/UsersContext"; // Importuoja naudotojo tipą iš konteksto.

type ChildProp = { children: ReactElement }; // Nustato tipą `ChildProp`, nurodantį, kad `children` yra „React“ elementas.

export type ConversationType = { // Apibrėžia pokalbio duomenų struktūrą.
    _id: string,
    user1: string,
    user2: string,
    hasUnreadMessages: boolean
};

// Apibrėžia išplėstinį pokalbio tipą `ConversationWithUser`, kuris įtraukia papildomą informaciją apie naudotoją.
type ConversationWithUser = ConversationType & {
  userData: UserType;
}

// Apibrėžia konteksto tipą, kuris apima visus funkcijas ir būsenas, reikalingas pokalbių valdymui.
export type ConversationsContextTypes = {
    conversations: ConversationWithUser[];
    activeConversationId: string | null;
    setActiveConversation: (id: string) => void;
    dispatch: React.Dispatch<ReducerActionTypeVariations>; 
    getConversationCount: () => number;
    startOrGetConversation: (otherUserId: string) => Promise<string | null>;
    addMessage: (conversationId: string, messageContent: string) => Promise<void>;
    fetchConversations: () => void;
    deleteConversation: (conversationId: string) => Promise<void>;
};

// Apibrėžia skirtingas `reducer` veiksmo tipus, kurie keis pokalbių būseną.
type ReducerActionTypeVariations = 
| { type: 'setConversations', data: ConversationWithUser[] } // Užpildyti pokalbių būseną
| { type: 'addConversation', newConversation: ConversationWithUser } // Pridėti naują pokalbį
| { type: 'deleteConversation', id: string } // Ištrinti pokalbį pagal ID
| { type: 'reset' }; // Išvalyti pokalbių būseną

// „Reducer“ funkcija, kuri keičia pokalbių būseną pagal įvykusį veiksmą.
const reducer = (state: ConversationWithUser[], action: ReducerActionTypeVariations): ConversationWithUser[] => {
    console.log("Reducer action:", action); // Parodo veiksmo tipą konsolėje
    switch(action.type) {
        case 'setConversations':
            console.log("Setting conversations:", action.data); // Rodo, kad nustatomi pokalbiai
            return action.data;
        case 'addConversation':
            console.log("Adding new conversation:", action.newConversation); // Rodo pridedamą pokalbį
            return [ ...state, action.newConversation ]; 
        case 'deleteConversation':
            console.log("Deleting conversation with ID:", action.id); // Rodo trinamo pokalbio ID
            return state.filter(conversation => conversation._id !== action.id);
        case 'reset':
            console.log("Resetting conversations"); // Praneša, kad būklė atstatoma
            return [];
        default:
            return state;           
    }
}

// Sukuria kontekstą `ConversationsContext`, kurio pradinė reikšmė yra `undefined`.
const ConversationsContext = createContext<ConversationsContextTypes | undefined>(undefined);

// Sukuria „Provider“ komponentą `ConversationsProvider`, apgaubianti visus vaikų komponentus ir suteikianti prieigą prie pokalbių funkcijų.
const ConversationsProvider = ({children}: ChildProp) => {
    const [conversations, dispatch] = useReducer(reducer, []); // Inicializuoja pokalbių būseną.
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null); // Valdo aktyvaus pokalbio ID būseną.

    // Funkcija, kuri nustato aktyvaus pokalbio ID.
    const setActiveConversation = (id: string) => {
        setActiveConversationId(id);
    };

    // Funkcija, kuri pradeda naują pokalbį arba grąžina esamo pokalbio ID, jei jis jau egzistuoja.
    const startOrGetConversation = async (otherUserId: string): Promise<string | null> => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        const userId = loggedInUser?._id;

        if (!userId) {
            console.error("User ID is missing");
            return null;
        }

        const existingConversation = conversations.find(
            conversation => 
                (conversation.user1 === userId && conversation.user2 === otherUserId) ||
                (conversation.user1 === otherUserId && conversation.user2 === userId)
        );

        if (existingConversation) {
            setActiveConversationId(existingConversation._id);
            return existingConversation._id;
        }

        // Jei pokalbis neegzistuoja, siunčia užklausą jį sukurti.
        try {
            const response = await fetch(`/api/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    '_id': userId
                },
                body: JSON.stringify({ user1: userId, user2: otherUserId }),
            });
            const newConversation = await response.json();
            if (newConversation.error) {
                console.error("Error creating conversation:", newConversation.error);
                return null;
            }
            dispatch({ type: 'addConversation', newConversation });
            setActiveConversationId(newConversation._id);
            return newConversation._id;
        } catch (error) {
            console.error("Failed to start or get conversation:", error);
            return null;
        }
    };

    // Funkcija, kuri siunčia užklausą gauti visų pokalbių sąrašą iš serverio.
    const fetchConversations = async () => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        const userId = loggedInUser?._id;

        console.log("Logged-in user ID:", userId);

        if (userId) {
            try {
                const response = await fetch(`/api/conversations`, {
                    headers: { '_id': userId }
                });
                const data = await response.json();

                console.log("Fetched conversations:", data);

                const filteredConversations = data.filter((conversation: ConversationType) => 
                    conversation.user1 === userId || conversation.user2 === userId
                );

                dispatch({ type: 'setConversations', data: filteredConversations });
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
            }
        }
    };

    // Funkcija, kuri prideda naują žinutę į pokalbį ir atnaujina pokalbių sąrašą.
    const addMessage = async (conversationId: string, messageContent: string) => {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: messageContent })
            });
            if (response.ok) {
                fetchConversations();
            } else {
                console.error("Failed to post message");
            }
        } catch (error) {
            console.error("Failed to add message:", error);
        }
    };

    // Funkcija, kuri ištrina nurodytą pokalbį ir atnaujina būseną.
    const deleteConversation = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/conversations/${conversationId}`, {
                method: 'DELETE',
                headers: {
                    '_id': JSON.parse(localStorage.getItem('loggedInUser') || '{}')._id
                }
            });
            if (response.ok) {
                dispatch({ type: 'deleteConversation', id: conversationId });
            } else {
                console.error("Failed to delete conversation");
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    };

    // Panaudoja `useEffect`, kad automatiškai iškviestų `fetchConversations` funkciją komponentui įsikėlus.
    useEffect(() => {
        fetchConversations();
        console.log("Conversations state:", conversations);
    }, []);

    // Funkcija, kuri grąžina pokalbių skaičių prisijungusiam naudotojui.
    const getConversationCount = () => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        const userId = loggedInUser?._id;

        return conversations.filter(conversation => 
            conversation.user1 === userId || conversation.user2 === userId
        ).length;
    };

    // Grąžina „Provider“ komponentą, kuris suteikia visiems vaikų komponentams prieigą prie pokalbių funkcionalumo.
    return (
        <ConversationsContext.Provider 
            value={{
              conversations,
              activeConversationId,
              setActiveConversation,
              dispatch,
              getConversationCount,
              startOrGetConversation,
              addMessage,
              fetchConversations,
              deleteConversation   
            }}
            >
            {children}
        </ConversationsContext.Provider>
    )
}

// Eksportuoja `ConversationsProvider` ir `ConversationsContext`, kad galėtų būti naudojami kituose komponentuose.
export { ConversationsProvider };
export default ConversationsContext;
