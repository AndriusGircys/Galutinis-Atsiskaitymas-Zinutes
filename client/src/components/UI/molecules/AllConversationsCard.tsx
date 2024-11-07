import styled from 'styled-components';

import { UserType } from '../../../contexts/UsersContext';
import { ConversationType } from '../../../contexts/ConversationsContext';

type Props ={
    data: ConversationType & {
        userData?: UserType;
    };
    onClick: () => void;
};

const CardDiv = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ccc;
  cursor: pointer;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }

  span {
    font-size: 16px;
    font-weight: normal;
    margin: 0;
  }
`;

const AllConversationsCard = ({ data, onClick }: Props) => {
    return ( 
        <CardDiv onClick={onClick} >
        <img 
           src={data.userData?.profileImage || "/default_profile_image.svg"}
           alt={data.userData?.username || "User"}
        />
        <span>{data.userData?.username || "Unknown User"}</span>
      </CardDiv>
     );
}
 
export default AllConversationsCard;