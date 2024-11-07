import { useFormik } from "formik";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from 'yup';
import { useContext, useState } from "react";
import styled from 'styled-components';

import UsersContext, { UsersContextTypes } from "../../contexts/UsersContext";

// Atnaujintas „LoginContainer“ su naujomis spalvomis, erdve ir animacijomis.
const LoginContainer = styled.section`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f4f6f8;
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

// „FormWrapper“ stilius su šviesiu fonu, šešėliu ir apvaliais kampais.
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

// „StyledInput“ su švelniais apvaliais kampais, šešėliu ir „focus“ efektu.
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

// „SubmitButton“ su spalva, animacijomis ir „hover“ bei „focus“ efektais.
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

// Login komponentas su atnaujintu stiliumi
const Login = () => {

    const { logUserIn } = useContext(UsersContext) as UsersContextTypes;
    const [loginMessage, setLoginMessage] = useState('');
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            username: '',
            password: ''
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(5, 'Username must be at least 5 symbols long') 
                .max(20, 'Username must be up to 20 symbols long')
                .required('Field must be filled')
                .trim(),
            password: Yup.string()
                .matches(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/,
                    'Password must contain: at least one lowercase letter, one uppercase letter, one digit, one special character (@$!%*?&) and be 8-25 characters long.'
                ).required('This field is required.')  
        }),
        onSubmit: async (values) => {
            try {
                const loginResponse = await logUserIn(values);
                if ("error" in loginResponse) { 
                    setLoginMessage(loginResponse.error);
                } else {
                    setLoginMessage(loginResponse.success);
                    setTimeout(() => {
                        navigate('/profile');
                    }, 3000);
                }
            } catch(err) {
                console.error(err);
            }
        }  
    });

    return ( 
        <LoginContainer>
            <h2>Login</h2>
            <FormWrapper onSubmit={formik.handleSubmit}>
                <div>
                    <StyledInput
                        type="text"
                        name="username" id="username"
                        placeholder="Username"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.username}
                    />
                    {
                        formik.touched.username && formik.errors.username 
                        && <p>{formik.errors.username}</p>
                    }
                </div>
                <div>
                    <StyledInput
                        type="password"
                        name="password" id="password"
                        placeholder="Password"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.password}
                    />
                    {
                        formik.touched.password && formik.errors.password 
                        && <p>{formik.errors.password}</p>
                    }
                </div>
                <SubmitButton type="submit" value="Sign In" />
            </FormWrapper>
            { loginMessage && <p>{loginMessage}</p> }
            <p>Do not have an account? Go to <Link to="/register">Register</Link></p>
        </LoginContainer>
    );
}

export default Login;
