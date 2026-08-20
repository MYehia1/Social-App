import { createContext, useState } from "react";

export let UserContext = createContext();

export default function UserContextProvider(props) {
    const [userLogin, setUserLogin] = useState(localStorage.getItem("userToken"))


    return(
        <>
        <UserContext.Provider value={{userLogin,setUserLogin}}>
            {props.children}
        </UserContext.Provider>
        </>
    )
}