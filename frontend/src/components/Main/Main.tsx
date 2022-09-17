
import './Main.css'

import { Link, useNavigate  } from "react-router-dom";

import background from "../../images/back-main-2x.jpeg";
import { useState } from 'react';

import configData from "../../appConfig.prod.json";

function isValidEmail(email:string){
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (email.match(validRegex)) {
      return true;
    } else {
      return false;
    }
}

function isValidURL(input:string){
    let url: URL;
    try {
        url = new URL(input);
    } catch (_) {
        return false;  
    }
    return true;
}

function Main() {
    const navigate = useNavigate();
    let [loading, setLoading] = useState(false);
    let [disabled, setDisabled] = useState(false);

    let [email, setEmail] = useState("");
    let [url, setUrl] = useState("");

    const submitRequest = async () => {
        if(!isValidEmail(email)){
            alert("Please enter a valid email");
            return;
        }

        if(!isValidURL(url)){
            alert("Please enter a valid url (Include 'https://')");
            return;
        }

        setDisabled(true);
        fetch(`${configData.APIUrl}/crawl?url=${encodeURIComponent(url)}&email=${encodeURIComponent(email)}`, {
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data);
            if(data.requestId){
                // redirect to loading page
                navigate("/loading")
            }
            if(data.message){
                alert(data.message);
                setDisabled(false);
            }
        })
        .catch((error) => {
            setDisabled(false);
            alert("Error! Please Try Again Later")
            console.error('Error:', error);
        }).finally(() => {
        });
    }

    
  return (
    <div className="container" >
    <div className="branding">
      <h1 className='branding-heading'>Wanna Make Sure All THE Links On Your Site Are A-Ok? We got Mew!</h1>
    </div>
    <div className='details-form'>
        <div className=" card">
            <h1 style={{ textAlign: 'center'}}>PurrLinQ</h1>
            <div className='form-control'>
                <label >Email</label>
                <input placeholder='mail@example.com' onInput={(event: any) => setEmail(event.target.value)} />
            </div>
            <div className='form-control'>
                <label >URL</label>
                <input placeholder='https://www.google.com' onInput={(event: any) => setUrl(event.target.value)}  />
            </div>
            <div className='form-control'>
                <button disabled={!email || !url || disabled} 
                    onClick={() => {
                        submitRequest(); }}
                    style={{color: '#fff'}} className='button'>
                        Analyze
                </button>
                
            </div>
        </div>
        <p className='guidelines'>Enter the URL you want to search and we’ll do the rest. 
            Once we’re done we’ll show you the results and also send you a 
            comphrehensive report of the summary.</p>

    </div>
    <div className='bg' >
        <img src={background} alt="" />
    </div>
    </div>
  )
}

export default Main;
