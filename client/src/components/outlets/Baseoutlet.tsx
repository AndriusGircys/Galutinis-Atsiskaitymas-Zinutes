import { Outlet } from "react-router-dom";
import styled from "styled-components";
import Header from "../UI/organisms/Header";


const StyledMain = styled.main`
 min-height: calc()(100vh - 100px);`;



const BaseOutlet = () => {
    return ( 
        <>
        <Header />
          <StyledMain>
            <Outlet />
          </StyledMain>
        </> 
    );
}
 
export default BaseOutlet;