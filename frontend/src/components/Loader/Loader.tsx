
import './Loader.css';
import Lottie from 'react-lottie';
import animationData from '../../animations/data.json';

function Loader() {

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid slice"
        }
      };

  return (
    <>
         <div>
            <Lottie 
                options={defaultOptions}
                height={400}
                width={400}
            />
        </div>
        <h4>Please wait a Meow-ment. We’re crawling your site now</h4>
        </>
  )
}

export default Loader;
