import { useContext} from 'react';
import UsersContext,{ UsersContextTypes } from '../../contexts/UsersContext';
import styled from 'styled-components';

const ProfileStyle = styled.section`
  display: flex;
  flex-direction:column;
  align-items: center;
  border: 1px solid #ccc;

  img {
    max-height: 200px;
  }
`;


const Profile = () => {
   const { loggedInUser } = useContext(UsersContext) as UsersContextTypes;

   if(!loggedInUser) return <p>Loading...</p>;

    return ( 
        <ProfileStyle>
            <h1>Profile - Welcome to the Chat Palace!</h1>
            <h3>{loggedInUser.username}</h3>
            <img src={loggedInUser.profileImage || "/default_profile_image.svg"} alt={`${loggedInUser.username}'s profile`} />
        </ProfileStyle>
     );
}
 
export default Profile;