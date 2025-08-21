import React, { useState } from 'react'
import '../assets/styles/Login.css'
import logo from '../assets/images/logo.jpg'
import { Link } from 'react-router-dom';
import {useAuth} from '../context/AuthContext'


const SignupPage:React.FC = () => {
	const {signUp, signInWithGoogle} = useAuth();
	// const navigate = useNavigate();
	

	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [error, setErrorMessage] = useState<string | null>(null);
	const [success, setSuccessMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword ] = useState(false);
	


	const handleSignUp = async (e:React.FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);

		if (password !== confirmPassword){
			setErrorMessage("Passwords do not match");
			return;
		}

		setLoading(true);
		const err = await signUp(email, password);

		setLoading(false);
		if (!err.success){
			setErrorMessage(err.message);
		}else{
			setSuccessMessage(err.message)
		}
	}

	  
	const handleGoogleSignUp = async () => {
	  const { data, error } = await signInWithGoogle();

	  if (error) {
	    console.error("Google sign-up failed:", error.message);
	    return;
	  }else{
	  	console.log("Google sign-up success:", data);
	  	// navigate('/dashboard')
	  }
	};
 
	
	return(
	  <div className="auth-body d-flex justify-content-center align-items-center min-vh-100 ">
	      <div className="neumorphic-card p-4 rounded-4 text-center">
	        <img
	          src={logo}
	          alt="Logo"
	          className="logo-img mx-auto mb-3 shadow"
	        />
	        <h5 className="fw-bold">ACCF IKOLE CHAPTER</h5>
	        <p className="text-muted">We're so glad you're joining us!</p>
	        {error ? <div className="alert alert-danger">{error}</div> : success && <div className="alert alert-success">{success}</div> }

	        <form onSubmit={handleSignUp}>

	        <div className="form-group neumorphic-input my-3">
	          <i className="fas fa-envelope me-2 text-muted"></i>
	          <input
	            type="email"
	            className="form-control border-0 bg-transparent shadow-none"
	            placeholder="Enter your email address"
	            onChange={(e) => setEmail(e.target.value)} 
	            value={email}
	          />
	        </div>

	        <div className="form-group neumorphic-input my-3">
	          <i className="fas fa-lock me-2 text-muted"></i>
	          <input
	            type={showPassword ? "text" : "password"}
	            className="form-control border-0 bg-transparent shadow-none"
	            placeholder="Password"
	            onChange={(e) => setPassword(e.target.value)} 
	            value={password}
	          />
	          <i 
	            className={`fas me-2 text-muted ${showPassword ? 'fa-eye-slash' : 'fa-eye'} `}
	            onClick={() => setShowPassword(!showPassword)}
	            style={{cursor: 'pointer'}}
	          ></i>
	        </div>

	        <div className="form-group neumorphic-input my-3">
	          <i className="fas fa-lock me-2 text-muted"></i>
	          <input
	            type={showPassword ? "text" : "password"}
	            className="form-control border-0 bg-transparent shadow-none"
	            placeholder="Confirm Password"
	            onChange={(e) => setConfirmPassword(e.target.value)} 
	            value={confirmPassword}
	          />
	          <i 
	            className={`fas me-2 text-muted ${showPassword ? 'fa-eye-slash' : 'fa-eye'} `}
	            onClick={() => setShowPassword(!showPassword)}
	            style={{cursor: 'pointer'}}
	          ></i>
	        </div>

	        <button type='submit' className="btn btn-primary w-100 rounded-pill py-2 mt-2" disabled={loading}>
			  {loading ? 'Signing up...' : 'Sign Up'}
			</button>
			</form>

			<div className="my-3 text-muted">— or —</div>

			<button className="google-btn w-100" onClick={handleGoogleSignUp} >
			 <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" /> Sign up with Google
			</button>  

	        <div className="mt-3">
	          <small className="text-dark">
	            Already have an account? <Link to='/login' style={{textDecoration:'none', color:'black'}}>Login</Link>
	          </small>
	        </div>
	      </div>
	  </div>
	)
};

export default SignupPage;