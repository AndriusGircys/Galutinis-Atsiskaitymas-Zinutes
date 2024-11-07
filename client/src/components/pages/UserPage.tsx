import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext} from 'react';
import { UserType } from '../../contexts/UsersContext';
import styled from 'styled-components';
import ConversationsContext, { ConversationsContextTypes} from '../../contexts/ConversationsContext';

const OtherUserStyle = styled.section`
  display: flex;
  flex-direction:column;
  align-items: center;
  border: 1px solid #ccc;
  padding: 20px;
  text-align: center;

  img {
    max-height: 200px;
    max-width: 200px;
    min-height: 100px;
    min-width: 100px;
    object-fit: contain;
  }
`;

const UserPage = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const { startOrGetConversation } = useContext(ConversationsContext) as ConversationsContextTypes;
    
    useEffect(() => {
        if (id) {
            fetch(`/api/users/${id}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error("Failed to fetch user data");
                    }
                    return res.json();
                })
                .then(data => setUser(data))
                .catch(error => console.error("Error fetching user:", error));
        }
    }, [id]);

    const handleStartConversation = async () => {
        if (id) {
            const conversationId = await startOrGetConversation(id);
            if (conversationId) {
                navigate(`/chat/${conversationId}`);
            }
        }
    };


    if (!user) {
        return <p>Loading user data...</p>;
    }

    return ( 
        <OtherUserStyle>
            <h1>User Profile</h1>
               <p>Username: {user.username}</p>
               <img src={user.profileImage || "/default_profile_image.svg"} 
                    alt={`${user.username}'s profile`} />
                <button onClick={handleStartConversation}>Start Conversation</button> 
        </OtherUserStyle>
     );
}
 
export default UserPage;
                 
        
       
             
       