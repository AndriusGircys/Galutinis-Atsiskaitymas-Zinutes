import { MessageType } from '../../../contexts/MessagesContext';
import { UserType } from '../../../contexts/UsersContext';

type MessageCardProps = {
    message: MessageType;
    users: UserType[];
};

const MessageCard = ({ message, users }: MessageCardProps) => {
    const sender = users.find(user => user._id === message.senderId);  // Fetch sender details
    const isOwnMessage = message.senderId === "loggedInUserId";  // Replace with actual logged-in user ID check

    return (
        <div className="message-card">
            <img src={sender?.profileImage} alt={`${sender?.username}'s profile`} />
            <div>
                <span>{sender?.username}</span>
                <p>{message.content}</p>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                {!isOwnMessage && <button>Like</button>}
            </div>
        </div>
    );
};

export default MessageCard;
