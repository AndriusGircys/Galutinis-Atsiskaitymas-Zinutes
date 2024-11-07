import { useContext, useState } from 'react';
import styled from 'styled-components';
import ConversationsContext, { ConversationsContextTypes } from '../../../contexts/ConversationsContext'

const DeleteButtonContainer = styled.div`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
`;

const DeleteConversationButton = ({ conversationId }: { conversationId: string }) => {
  const { deleteConversation } = useContext(ConversationsContext) as ConversationsContextTypes;
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    deleteConversation(conversationId);
  };

  return (
    <DeleteButtonContainer
      onClick={handleDelete}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={isHovered ? "/delete-button-active.svg" : "/delete-button.svg"}
        alt="delete conversation"
        width={24}
        height={24}
      />
    </DeleteButtonContainer>
  );
};

export default DeleteConversationButton;
