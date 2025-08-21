import React, { useState } from 'react'
import '../assets/styles/Login.css'
import logo from '../assets/images/logo.jpg'
import { Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext'


const Login:React.FC = () => {
	const {signIn} = useAuth();
	const navigate = useNavigate();

	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword ] = useState(false);
	


	const handleLogin = async (e:React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		
		const err = await signIn(email, password)
		setLoading(false);
		if(err.error){
			setError(err.error.message);
		}else{
			navigate('/dashboard')
		}
	}
	return(
	  <div className="auth-body d-flex justify-content-center align-items-center min-vh-100 ">
	      <div className="neumorphic-card p-4 rounded-4 text-center">
	        <img
	          src={logo}
	          alt="Logo"
	          className="logo-img mx-auto mb-3 shadow"
	        />
	        <h5 className="fw-bold">ACCF IKOLE CHAPTER</h5>
	        <p className="text-muted">Welcome Back!</p>
	        {error && <div className='alert alert-danger'>{error}</div>}
	        <form onSubmit={handleLogin}>

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

	        <button type='submit' className="btn btn-primary w-100 rounded-pill py-2 mt-2" disabled={loading}>
	          {loading ? 'Logging in...':'Login'}
	        </button>
	        </form>

	        <div className="mt-3">
	          <small className="text-dark">
	            Forgot password? <b>or</b> <Link to='/register' style={{textDecoration:'none', color:'black'}}>Sign Up</Link>
	          </small>
	        </div>
	      </div>
	  </div>
	)
};

export default Login;