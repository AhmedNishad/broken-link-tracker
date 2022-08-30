
import './Main.css'

import { Link } from "react-router-dom";

import background from "../../images/back-main-2x.jpeg";

function Main() {

  return (
    <div className="container" >
    <div className="branding">
      <h1 className='branding-heading'>Wanna Make Sure All THE Links On Your Site Are A-Ok?We got Mew!</h1>
    </div>
    <div className='details-form'>
        <div className=" card">
            <h1 style={{ textAlign: 'center'}}>PurrLinQ</h1>
            <div className='form-control'>
                <label >Email</label>
                <input />
            </div>
            <div className='form-control'>
                <label >URL</label>
                <input />
            </div>
            <div className='form-control'>
                <button className='button'>
                    <Link style={{color: '#fff'}} to="/loading">
                        Analyze
                    </Link>
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
