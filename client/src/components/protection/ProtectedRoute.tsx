import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import UsersContext, {UsersContextTypes} from '../../contexts/UsersContext';


type Props = {
  children: React.ReactNode;
}

const ProtectedRoute = ({children}: Props) => {

  const { loggedInUser} = useContext(UsersContext) as UsersContextTypes;

  if (!loggedInUser) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;

