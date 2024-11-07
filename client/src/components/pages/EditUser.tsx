import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik, Field, Form } from 'formik';
import UsersContext, { UserType, UsersContextTypes } from '../../contexts/UsersContext'; 


const EditUser: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const usersContext = useContext(UsersContext) as UsersContextTypes;
    const { returnSpecificUser, editSpecificUser } = usersContext;
  
  const [user, setUser] = useState<UserType | undefined>(undefined);

  useEffect(() => {
    if (id) {
      const fetchedUser = returnSpecificUser(id);
      console.log("Fetched User:", fetchedUser);
      setUser(fetchedUser);
    }
  }, [id, returnSpecificUser]);

  const validationSchema = Yup.object({
    username: Yup.string()
    .min(5, 'username must be at least 5 symbols length')
    .max(20, 'Username can be up to 20 symbols length')
    .trim() ,
    profileImage: Yup.string()
    .url('Must be valid URL'),
    password: Yup.string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/,
      'Password must be at least: one lower case, one upper case, one number, one special symbol and length to be between 8 and 25'
    )
    .trim(),
    passwordRepeat: Yup.string().oneOf(
      [Yup.ref('password'), ''],
      'Passwords must match'
    ),
  });  

    return ( 
        user && (
            <Formik
              initialValues={{
                username: user?.username || '',
                profileImage: user?.profileImage || '',
                password: '', // Password remains empty unless changed
                passwordRepeat: '', // Add passwordRepeat field for confirmation
              }}
              validationSchema={validationSchema}
              enableReinitialize={true}
              onSubmit={async (values) => {
                    // Create a filtered object that only includes non-empty values
                    const filteredValues = (Object.keys(values) as Array<keyof typeof values>).reduce((acc, key) => {
                      if (values[key] && values[key].trim() !== "") {
                          acc[key] = values[key];
                      }
                      return acc;
                  }, {} as Partial<typeof values>);  

                  console.log("Filtered Values:", filteredValues);

             
      
                const result = await editSpecificUser(filteredValues as Omit<UserType, '_id'>, user!._id);
                if ('success' in result) {
                  navigate('/profile');
                }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  <div>
                    <label htmlFor="username">Username:</label>
                    <Field name="username" id="username" type="text" />
                    {errors.username && touched.username && <div>{errors.username}</div>}
                  </div>
                  <div>
                    <label htmlFor="profileImage">Profile Image:</label>
                    <Field name="profileImage" id="profileImage" type="text" placeholder="Enter profile image URL" />
                  </div>
                  <div>
                    <label htmlFor="password">New Password:</label>
                    <Field name="password" id="password" type="password" placeholder="Leave blank to keep current password"  />
                  </div>
                  <div>
                    <label htmlFor="passwordRepeat">Password Repeat</label>
                    <Field name="passwordRepeat" id="passwordRepeat" type="password" />
                    {errors.passwordRepeat && touched.passwordRepeat && <div>{errors.passwordRepeat}</div>}
                  </div>
                  <button type="submit" disabled={isSubmitting}>
                    Update User
                  </button>
                </Form>
              )}
            </Formik>
          )
 );
}
 
export default EditUser;