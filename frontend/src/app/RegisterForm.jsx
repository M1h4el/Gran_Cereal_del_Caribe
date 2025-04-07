import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchData } from "../../utils/api";
import "../styles/RegisterForm.scss";

function BodyLogin() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [inviteCode, setInviteCode] = useState("");
  const [hasInvite, setHasInvite] = useState(false);
  const [formError, setFormError] = useState("");

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
    setFormError("");

    if (hasInvite && inviteCode.trim() === "") {
      setFormError("Por favor ingresa un código de invitación.");
      return;
    }

    const payload = {
      userName,
      email,
      password,
      role,
      codeCollaborator: null,
    };
  
    if (hasInvite) {
      payload.codeCollaborator = inviteCode;
    }

    try {

      console.log(payload)
      const response = await fetchData("auth/register", "POST", payload);
  
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
            <div className="inputLogin">
              <label>
                <input
                  type="checkbox"
                  checked={hasInvite}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasInvite(checked);
                    if (!checked) {
                      setInviteCode("");
                      setRole("Admin");
                      setFormError("");
                    } else {
                      setRole("Vendedor");
                    }
                  }}
                />
                Tengo un código de invitación
              </label>
            </div>
            <div className="inputLogin">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={!hasInvite}
              >
                <option value="vendedor">Vendedor</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <div className="inputLogin">
              <input
                type="text"
                placeholder="Código de invitación"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={!hasInvite}
              />
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
