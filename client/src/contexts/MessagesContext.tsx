// Importuoja „React“ hook'us ir funkcijas, reikalingas konteksto sukūrimui.
import { useReducer, createContext, ReactElement } from 'react';

// Apibrėžia `ChildProp` tipą, kuris nurodo, kad `children` yra „React“ elementas (komponentas).
type ChildProp = { children: ReactElement };

// Apibrėžia `MessageType` tipą, kuris nurodo žinutės struktūrą (ID, pokalbio ID, siuntėjo ID, turinį, laiką ir patiktukus).
export type MessageType = {
    _id: string,
    conversationId: string,
    senderId: string,
    content: string,
    timestamp: string,
    likes?: string[]
};

// `NewMessageType` yra naujos žinutės tipas, kuris neturi `_id` (kadangi naujai žinutei dar nepriskirtas ID).
type NewMessageType = Omit<MessageType, '_id'>;

// Apibrėžia konteksto tipą (`MessagesContextTypes`), kuris įtraukia žinučių masyvą, „dispatch“ funkciją ir dvi funkcijas - vieną gauti žinutes, kitą pridėti naują žinutę.
export type MessagesContextTypes = {
    messages: MessageType[];
    dispatch: React.Dispatch<ReducerActionTypeVariations>;
    getMessagesByConversationId: (conversationId: string) => Promise<void>;
    postMessage: (message: NewMessageType) => void; // Funkcija naujos žinutės pridėjimui
};

// Apibrėžia `ReducerActionTypeVariations` - tai skirtingi veiksmai, kuriuos `reducer` gali atlikti (nustatyti žinutes, pridėti naują žinutę arba išvalyti būseną).
type ReducerActionTypeVariations =
{ type: 'setMessages', data: MessageType[] } |
{ type: 'postMessages', newMessage: MessageType} |
{ type: 'reset'}

// „Reducer“ funkcija, kuri valdo žinučių būseną pagal veiksmą (`action`).
const reducer = (state: MessageType[], action: ReducerActionTypeVariations): MessageType[] => {
    switch (action.type) {
        case 'setMessages':
            return action.data; // Nustato visą žinučių masyvą
        case 'postMessages':
            return [...state, action.newMessage]; // Prideda naują žinutę į masyvą
        case 'reset':
            return []; // Išvalo būseną
        default:
            return state;
    }
};

// Sukuria „React“ kontekstą `MessagesContext`, kuris yra skirtas naudoti žinučių tvarkymui. Pradinė reikšmė yra `undefined`.
const MessagesContext = createContext<MessagesContextTypes | undefined>(undefined);

// „Provider“ komponentas `MessagesProvider`, kuris apgaubia „children“ komponentus, suteikdamas jiems prieigą prie konteksto.
const MessagesProvider = ( {children } : ChildProp) => {

    const [messages, dispatch] = useReducer(reducer, []); // Inicializuoja būseną su pradiniu masyvu.

    // Funkcija, kuri gauna žinutes pagal pokalbio ID iš serverio.
    const getMessagesByConversationId = async (conversationId: string) =>{
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                headers: {
                    'Content-Type': 'application/json',
                    '_id': JSON.parse(localStorage.getItem('loggedInUser') || '{}')._id
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: 'setMessages', data }); // Nustato gautas žinutes į būseną.
            } else {
                console.error("Failed to fetch messages:", response.status);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    // Funkcija, kuri prideda naują žinutę į serverį ir atnaujina būseną.
    const postMessage = async (message: NewMessageType) => {
        try {
            const { conversationId, ...messageData } = message;
            const loggedInUser = localStorage.getItem('loggedInUser');

           if (!loggedInUser) {
            console.error("User not found in local storage.");
            throw new Error("User not authenticated.");
           }

           // Paruošia naudotojo ID iš `localStorage`
          const userId = JSON.parse(loggedInUser)._id;
            if (!userId) {
               console.error("User _id not found in local storage.");
               throw new Error("User not authenticated.");
            }

            const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    '_id': userId 
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                throw new Error(`Failed to post message with status ${response.status}`);
            }

            const savedMessage: MessageType = await response.json(); // Tikimasi, kad serveris grąžins žinutę su `_id`.
            dispatch({ type: 'postMessages', newMessage: savedMessage });
        } catch (error) {
            console.error("Error posting message:", error);
        }
    };

    // Grąžina `Provider` komponentą su pritaikytomis reikšmėmis (`value`), kuriuos perduodami į children.
    return  (
        <MessagesContext.Provider
           value={{
            messages,
            dispatch,
            getMessagesByConversationId,
            postMessage,
           }}
           >
            { children }
           </MessagesContext.Provider>
    )
}

// Eksportuoja `MessagesProvider` ir `MessagesContext`, kad galėtų būti naudojami kituose komponentuose.
export { MessagesProvider };
export default MessagesContext;
