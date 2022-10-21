
import './Results.css'

import { Link, useParams } from "react-router-dom";

import {results, resultsWithErrors} from '../../testData';
import { useEffect, useState } from 'react';

import linksIcon from '../../images/links.png'
import notFoundIcon from '../../images/404.png'

import goodScoreIcon from '../../images/good-score.png'
import okayScoreIcon from '../../images/okay-score.png'
import poorScoreIcon from '../../images/poor-score.png'

import configData from "../../appConfig.prod.json";

function Results() {
    let { requestId } = useParams();
    
    let [results, setResults] = useState<any[]>([]);
    let [url, setURL] = useState("");
    let [page, setPage] = useState(0);
    let [pageSize, setPageSize] = useState(5);

    const loadResults = async () => {
        // fetch request to get the data
        if(requestId){
            const response = await fetch(`${configData.APIUrl}/results?id=${encodeURIComponent(requestId.toString())}`);
            const resultArr = await response.json();
            console.log(resultArr);
            if(resultArr.results){
                let resultObj = JSON.parse(resultArr.results);
                setURL(resultObj.baseUrl);
                if(resultObj.results){
                    setResults(resultObj.results);
                }
            }
        }
    }

    useEffect( () => {
        loadResults().then(() => {

        });
      }, []);

    
    let i = 0;
    let brokenLinks = 0;
    let linkElements: any[] = [];

    let resultObjects = results != [] && results.map((r: any) => {
        let links = r.links.map((l: any) => {
            i++;
            if(!r.statusCode.toString().startsWith("2")){
                brokenLinks++;
            }

            let actionMessage = <></>;
            if(r.statusCode.toString().startsWith("2")){
                actionMessage = <span>This is purr-fect</span>
            }else if(r.statusCode.toString().startsWith("3")){
                actionMessage = <span >So fur, so good</span>
            }else{
                actionMessage = <div><a href="https://developers.google.com/search/docs/advanced/crawling/http-network-errors"
                 className='learn-more-button'>Learn More</a></div>
            }

            return (
                <tr key={i}>
                    <td>{i}</td>
                    <td><a href={l.link}>{l.link}</a></td>
                    <td><span>
                        {l.pageLoadTime ? parseFloat((l.pageLoadTime/1000).toString()).toFixed(2) + "s" : ""}
                    </span>
                    {!l.pageLoadTime ? <span style={{fontSize: "2.2rem"}}>&#8734;</span> : <></>}
                    
                    </td>
                    <td style={{display: "flex", alignItems: "center", justifyContent:"flex-start"}}>
                        <div className={"status-code " + (r.statusCode ? "status-code-" + r.statusCode.toString().charAt(0) : "")}>
                        </div><span style={{
                            color: "#9EA0A5"
                        }}>{r.statusCode}</span></td>
                    <td style={{
                        textAlign: "center",
                        color: "#9EA0A5"
                    }}>{actionMessage}</td>
                </tr>
            )
        }); 

        linkElements.push(...links);

        return (
            <>
                {links}
            </>
        );
    });

    // ---------------------------- PURR Calculations -------------------------------
    let purrScore = Math.ceil(brokenLinks/i * 100);
    let purrIcon = goodScoreIcon;
    if(purrScore > 70){
        purrIcon = goodScoreIcon;
    }else if(purrScore > 40){
        purrIcon = okayScoreIcon;
    }else{
        purrIcon = poorScoreIcon;
    }

    let paginationStart = page * pageSize;
    let paginationEnd = (page * pageSize) + pageSize;

  return (
    <div id='results-page'>
        <div id='info'>
            <div className="result-card">
                <div className='result-card-title'>
                    <h4>Links Analzed</h4>
                    <h2>{i}</h2>
                </div>
                <div className='result-card-icon red-bg'>
                    <img src={linksIcon}/>
                </div>
            </div>
            <div className="result-card">
                <div className='result-card-title'>
                    <h4>Broken Links</h4>
                    <h2>{brokenLinks}</h2>
                </div>
                <div className='result-card-icon red-bg'>
                    <img src={notFoundIcon}/>
                </div>
            </div>
            <div className="result-card">
                <div className='result-card-title'>
                    <h4>Purr Score</h4>
                    <h2>{purrScore}</h2>
                </div>
                <div className='result-card-icon'>
                    <img src={purrIcon}/>
                </div>
            </div>
        </div>
        <div id='table'>
            <div className='link-info'>
                <h3>Purr Report</h3>
                <h5>{url}</h5>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Index</th>
                        <th>URL</th>
                        <th>Load Speed</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {linkElements.slice(paginationStart, paginationEnd)}
                </tbody>
            </table>
            <div className='pagination-controls'>
                <div>
                    <p>Rows per page :</p>
                    <select onChange={(event:any) => {setPageSize(parseInt(event.target.value)); setPage(0)} }>
                        <option value="5">5</option>
                        <option value="10">10</option>
                    </select>
                    <p>{page + 1}-{(page + 1) * pageSize} of {i}</p>
                    {page > 0 && (<button onClick={() => {setPage(page - 1)}}>&#60;</button>)}
                    {page < Math.floor(i/pageSize) && (<button onClick={() => {setPage(page + 1)}}>&#62;</button>)}
                </div>
                
            </div>
        </div>

    </div>
  )
}

export default Results;
