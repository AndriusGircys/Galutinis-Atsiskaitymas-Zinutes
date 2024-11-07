import { ChangeEvent} from 'react';

type MessageInputProps = {
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSendMessage: () => void;
};

const MessageInput = ({ value, onChange, onSendMessage}: MessageInputProps) => {
    return ( 
        <div>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder="Type a message"
        />
        <button onClick={onSendMessage}>Send</button>
    </div> 
     );
}
 
export default MessageInput;