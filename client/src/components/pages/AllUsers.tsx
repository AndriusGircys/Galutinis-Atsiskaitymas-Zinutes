import { useContext } from 'react';

import styled from 'styled-components';

import UsersContext, { UsersContextTypes} from '../../contexts/UsersContext';
import AllUsersCard from '../UI/molecules/AllUsersCard';

const StyledSection = styled.section`
  padding: 10px 30px;
`;

const AllUsers = () => {

const { users, loggedInUser } = useContext(UsersContext) as UsersContextTypes;

// Filter out the logged-in user from the users list
  const filteredUsers = users.filter(user => user._id !== loggedInUser?._id);

    return ( 
        <StyledSection>
            <h2>All Users</h2>
            <div>
                   {filteredUsers.map(user =>
                    <AllUsersCard
                      key={user._id}
                      data={user}
                      userId={user._id}
                    />  
                
                )}
            </div>
        </StyledSection>
     );
}
 
export default AllUsers;
