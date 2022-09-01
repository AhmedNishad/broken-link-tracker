
import './Results.css'

import { Link } from "react-router-dom";

import {results, resultsWithErrors} from '../../testData';

const APIUrl = `http://localhost:3000`

function Results() {

    const loadResults = () => {
        // fetch request to get the data
    }

    let resultObjects = resultsWithErrors.results.map((r: any) => {
        let links = r.links.map((l: any) => {
            return (
                <div className='link-result'>
                    <a href={l.link}>{l.link}</a>
                    <span>{l.pageLoadTime ? l.pageLoadTime + "ms" : ""}</span> 
                    {l.snapshotLocation ? <img src={APIUrl + "/" + l.snapshotLocation}/> : <></>}
                </div>
            )
        }); 

        return (
            <div className='status-group'>
                <h2>{r.statusCode}</h2>
                <div className='link-group'>
                    {links}
                </div>
            </div>
        );
    });

  return (
    <div >
        <h2>Total Link Count: 58</h2>
        <h3>Time Taken: 2mins</h3>
        {resultObjects}
    </div>
  )
}

export default Results;
