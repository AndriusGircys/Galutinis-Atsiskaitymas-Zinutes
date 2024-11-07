import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import styled from 'styled-components';

import UsersContext, { UsersContextTypes, UserRegistrationType } from '../../contexts/UsersContext';

// RegisterContainer – pagrindinis komponento konteineris
const RegisterContainer = styled.section`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f4f6f8; /* Šviesus fonas */
    padding: 20px;

    h2 {
        margin-bottom: 20px;
        text-align: center;
        color: #333;
        font-size: 2em;
    }

    p {
        margin-top: 15px;
        text-align: center;
        color: #666;
    }
`;

// FormWrapper – formos konteineris su šešėliu ir apvaliais kampais
const FormWrapper = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 400px;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
`;

// StyledInput – stilius įvesties laukams su apvaliais kampais ir focus efektu
const StyledInput = styled.input`
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border-radius: 5px;
    border: 1px solid #ddd;
    box-sizing: border-box;
    background-color: #f9f9f9;
    transition: border-color 0.3s ease;

    &:focus {
        border-color: #7b68ee;
        outline: none;
        box-shadow: 0 0 4px rgba(123, 104, 238, 0.2);
    }
`;

// SubmitButton – stilius mygtukui su hover ir focus efektais
const SubmitButton = styled.input`
    width: 100%;
    padding: 12px;
    font-size: 16px;
    cursor: pointer;
    background-color: #7b68ee;
    color: #fff;
    border: none;
    border-radius: 5px;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        background-color: #6a5acd;
    }

    &:focus {
        outline: none;
        box-shadow: 0px 0px 8px rgba(106, 90, 205, 0.5);
    }
`;

// Register – pagrindinė registracijos komponento funkcija
const Register = () => {
    const { addNewUser } = useContext(UsersContext) as UsersContextTypes;
    const [registerMessage, setRegisterMessage] = useState('');
    const navigate = useNavigate();

    // Formik naudojamas formos valdymui
    const formik = useFormik<UserRegistrationType>({
        initialValues: {
            username: '',
            profileImage: '',
            password: '',
            passwordRepeat: '',
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(5, 'username must be at least 5 symbols length')
                .max(20, 'Username can be up to 20 symbols length')
                .required('Field is required')
                .trim(),
            profileImage: Yup.string()
                .url('Must be valid URL'),
            password: Yup.string()
                .matches(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/,
                    'Password must be at least: one lower case, one upper case, one number, one special symbol and length to be between 8 and 25'
                )
                .required('Field must be filled')
                .trim(),
            passwordRepeat: Yup.string()
                .oneOf([Yup.ref('password')], 'Passwords must match')
                .required('Field must be filled')
        }),
        onSubmit: async (values: UserRegistrationType) => {
            console.log("Form values being submitted:", values);

            const { username, profileImage, password, passwordRepeat } = values;
            const registerResponse = await addNewUser({
                username,
                profileImage,
                password,
                passwordRepeat,
            });

            if (registerResponse.error) {
                setRegisterMessage(registerResponse.error || '');
            } else {
                setRegisterMessage(registerResponse.success || 'Registration successful');
                setTimeout(() => {
                    navigate('/profile');
                }, 3000);
            }
        }
    });

    return ( 
        <RegisterContainer>
            <h2>Register</h2>
            <FormWrapper onSubmit={formik.handleSubmit} >
                <div>
                    <StyledInput
                        type="text"
                        name="username" id="username"
                        placeholder="Username"
                        value={formik.values.username}
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                    />
                    {formik.touched.username && formik.errors.username &&
                        <p>{formik.errors.username}</p>}
                </div>  
                <div>
                    <StyledInput
                        type="url"
                        name="profileImage" id="profileImage"
                        placeholder="Profile Image URL"
                        value={formik.values.profileImage}
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                    />
                    {formik.touched.profileImage && formik.errors.profileImage &&
                        <p>{formik.errors.profileImage}</p>}
                </div>
                <div>
                    <StyledInput
                        type="password"
                        name="password" id="password"
                        placeholder="Password"
                        value={formik.values.password}
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                    />
                    {formik.touched.password && formik.errors.password &&
                        <p>{formik.errors.password}</p>}
                </div> 
                <div>
                    <StyledInput
                        type="password"
                        name="passwordRepeat" id="passwordRepeat"
                        placeholder="Password Repeat"
                        value={formik.values.passwordRepeat}
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                    />
                    {formik.touched.passwordRepeat && formik.errors.passwordRepeat &&
                        <p>{formik.errors.passwordRepeat}</p>}
                </div> 
                <SubmitButton  type="submit" value="Sign Up"/>  
            </FormWrapper>
            {registerMessage && <p>{registerMessage}</p>}
            <p>Already have an account? Go to: <Link to="/login">Sign In</Link></p>
        </RegisterContainer>
    );
}

export default Register;
