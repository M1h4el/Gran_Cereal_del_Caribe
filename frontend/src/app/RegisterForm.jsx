import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchData } from "../../utils/api";
import "../styles/RegisterForm.scss";

function BodyLogin() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleChangeName = (e) => {
    const { value } = e.target;
    setUserName(value);
  };

  const handleChangeEmail = (e) => {
    const { value } = e.target;
    setEmail(value);
  };

  const handleChangePassword = (e) => {
    const { value } = e.target;
    setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetchData("auth/register", "POST", {
        userName,
        email,
        password,
      });
  
      if (response.error) {
        alert(response.error);
      } else {
        alert("Usuario registrado satisfactoriamente");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al registrar:", error);
    }
  
  };

  return (
    <div className="body-login">
      <section className="container-1">
        <div className="PresentationMP4">asdasdasd</div>
        <div>
          <h3 className="Slogan">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Est, dolor.
          </h3>
        </div>
      </section>
      <section className="container-2">
        <div className="form">
          <div className="TitleForm">
            <h2>Registrate</h2>
          </div>
          <div className="SignInForm">
            <div className="inputLogin">
              <input
                type="text"
                placeholder="Nombre"
                value={userName}
                onChange={(e) => handleChangeName(e)}
              ></input>
            </div>
            <div className="inputLogin">
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => handleChangeEmail(e)}
              ></input>
            </div>
            <div className="inputLogin">
              <input placeholder="Confirmar E-mail"></input>
            </div>
            <div className="inputLogin">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => handleChangePassword(e)}
              ></input>
            </div>
            <div className="inputLogin">
              <input 
                type="password"
                placeholder="Confimar Contraseña"></input>
            </div>
          </div>
        <div className="divButtom">
          <button
            className="custom-buttonSignup"
            onClick={(e) => handleSubmit(e)}
          >
            Sign up
          </button>
        </div>
        </div>
      </section>
    </div>
  );
}

export default BodyLogin;
