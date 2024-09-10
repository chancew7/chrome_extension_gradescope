

async function getDoc(url){
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc;
}

async function getAverageScore(url){

    try {

        const doc = await getDoc(url);
        const scoreElements = doc.querySelectorAll('.submissionStatus--score');

        let totalPts = 0;
        let totalMaxPts = 0;
        let percentScore = 0;

        for (let i = 0; i < scoreElements.length; i++){
            const scoreElement = scoreElements[i];
            const scoreInfo = scoreElement.textContent.trim();
            const pts = parseFloat(scoreInfo.split('/')[0].trim());
            const maxPts = parseFloat(scoreInfo.split('/')[1].trim());
            totalPts += pts;
            totalMaxPts += maxPts;
        }
        percentScore = totalPts / totalMaxPts;

        return {

            totalPts: totalPts, 
            totalMaxPts: totalMaxPts, 
            percentScore: percentScore

        };
    } catch(error){
        console.error("Caught an issue, didn't do much with it: ", error)
    }

    return null;
}

async function gradedAssignmentExists(url){
    const doc = await getDoc(url);

    const statusElements = doc.querySelectorAll('.submissionStatus');

    for (let i = 0; i < statusElements.length; i++){
        const statusText = statusElements[i].textContent.trim();

        if (statusText != "No Submission" && statusText != "Submitted"){
            return true;
        }
    }

    return false;
}

async function determineScorePicture(score, url){

    let gradedAssignmentExistsVar = await gradedAssignmentExists(url);

    scoreDecimal = score.percentScore;
    
    if (score.totalMaxPts == 0){
        gradedAssignmentExistsVar = false;
    }

    try {

        if (!gradedAssignmentExistsVar){
            return chrome.runtime.getURL("/pictures/start.png");
        }
        else if (scoreDecimal == 1){
            return chrome.runtime.getURL("/pictures/drake.png");
        }
        else if (scoreDecimal >= .97){
            return chrome.runtime.getURL("/pictures/cool.png");
        }
        else if (scoreDecimal >= .94){
            return chrome.runtime.getURL("/pictures/incredible.png");
        }
        else if (scoreDecimal >= .9){
            return chrome.runtime.getURL("/pictures/normal.png");
        }
        else if (scoreDecimal >= .85){
            return chrome.runtime.getURL("/pictures/fine.png");
        }
        else if (scoreDecimal >= .8){
            return chrome.runtime.getURL("/pictures/slightlyWeird.png");
        }
        else if (scoreDecimal >= .75){
            return chrome.runtime.getURL("/pictures/verySad.png");
        }
        else if (scoreDecimal >= .7){
            return chrome.runtime.getURL("/pictures/superMessedUp.png");
        }
        else if (scoreDecimal >= .65){
            return chrome.runtime.getURL("/pictures/scary.png");
        }
        else if (scoreDecimal >= .6){
            return chrome.runtime.getURL("/pictures/veryWeird.png");
        }
        else {
            return chrome.runtime.getURL("/pictures/over.png");
        }
    }
    catch (error){
        if (! error.message.includes("Extension context invalidated")){
            console.error("An error occured: " + error);
        }
    }
}

function getTimeDifference(nearestDate) {

    const now = new Date();
    const timeUntilDue = nearestDate - now;

    const months = Math.floor(timeUntilDue / (1000 * 60 * 60 * 24 * 30));
    const weeks = Math.floor((timeUntilDue % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24 * 7));
    const days = Math.floor((timeUntilDue % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilDue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilDue % (1000 * 60 * 60)) / (1000 * 60));

    return [months, weeks, days, hours, minutes];
}

async function getNextDueDate(url){

    const doc = await getDoc(url);

    const body = doc.querySelector('tbody');
    const rows = body.querySelectorAll('tr[role="row"]')
    const rowsArray = Array.from(rows);

    const now = new Date();
    let nearestDate = null;
    let minDiff = Infinity;

    for (const row of rowsArray){

        const submissionStatus = row.querySelector('.submissionStatus--text');
        let statusText;
        if (submissionStatus){
            statusText = submissionStatus.textContent.trim();
        }
        if (statusText != 'No Submission'){
            continue; 
        } 

        const dueDates = row.querySelectorAll('.submissionTimeChart--dueDate');
        let standardDueDate;
        if (dueDates[0]){
            standardDueDate = new Date(dueDates[0].getAttribute('datetime')); 
        }
        else {
            continue;
        }
           
        let lateDueDateExists = false
        if (dueDates.length > 1){
            lateDueDateExists = true;
        }  
        if (lateDueDateExists){
            lateDueDate = new Date(dueDates[1].getAttribute('datetime'));
        }
        

        const standardDifference = new Date(standardDueDate.getTime() - now.getTime());
        let lateDifference;
        if (lateDueDateExists){
            lateDifference = new Date(lateDueDate.getTime() - now.getTime());
        }

        if (standardDifference > 0 && standardDifference < minDiff){
            minDiff = standardDifference;
            nearestDate = standardDueDate;
        }
        else if (lateDueDateExists){
            if (standardDifference < 0 && lateDueDateExists && lateDifference > 0 && lateDifference < minDiff){
                minDiff = lateDifference;
                nearestDate = lateDueDate;
            }
        }
        
    }

    if (nearestDate){
        const [months, weeks, days, hours, minutes] = getTimeDifference(nearestDate); 

        const units = [

            {value: months, name: 'month'},
            {value: weeks, name: 'week'},
            {value: days, name: 'day'},
            {value: hours, name: 'hour'},
            {value: minutes, name: 'minute'}
        ];

        const nonZeroUnits = units.filter(unit => unit.value > 0);
        const significantUnits = nonZeroUnits.slice(0, 2);

        const retString = "Next assignment: " + significantUnits
            .map(unit => `${unit.value} ${unit.name}${unit.value > 1 ? 's' : ''}`)
            .join(' ');
        return retString;
    }
    else {
        return "No upcoming assignments";
    }


}

async function presentGradePictures(courseBoxesArray){

    for (const[index, courseBox] of courseBoxesArray.entries()){

        if (courseBox.href){

            const fullUrl = new URL(courseBox.href, window.location.origin);

            const score = await getAverageScore(fullUrl.href);

            const img = document.createElement('img');
            img.src = await determineScorePicture(score, fullUrl.href);
            img.className = 'gradePicture';

            const imgContainer = document.createElement('div');
            imgContainer.className = 'imgContainer';
            imgContainer.appendChild(img);

            img.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                img.style.display = 'none';
            });

            courseBox.appendChild(imgContainer);

        }
    }
}

async function presentNearestDueDate(courseBoxesArray){

    for (const courseBox of courseBoxesArray){

        if (courseBox.href){

            const fullUrl = new URL(courseBox.href, window.location.origin);
            const date = await getNextDueDate(fullUrl.href);

            if (date != "No upcoming assignments"){

                const dateParts = date.split(": ");
                const prefixText = dateParts[0] + ": ";
                const timeText = dateParts[1];

                const textContainer = document.createElement('div');
                textContainer.className = 'textContainer';

                const prefixSpan = document.createElement('span');
                prefixSpan.textContent = prefixText;

                const timeSpan = document.createElement('span');
                timeSpan.textContent = timeText;
                timeSpan.className = 'dueDate';

                textContainer.appendChild(prefixSpan);
                textContainer.appendChild(timeSpan);
                courseBox.appendChild(textContainer);
            }
            else {
                const textContainer = document.createElement('div');
                textContainer.className = 'textContainer';

                const prefixSpan = document.createElement('span');
                prefixSpan.textContent = date; 

                textContainer.appendChild(prefixSpan);
                courseBox.appendChild(textContainer);
            }
        }
    }
}

async function presentGradeScore(courseBox){

    const fullUrl = new URL(courseBox.href, window.location.origin);
    let score = await getAverageScore(fullUrl.href);

    if (score.totalMaxPts == 0){
        score.percentScore = 100;
    }
    else{
        score.percentScore *= 100;
        score.percentScore = (score.percentScore).toFixed(2);
    }

    const message = score.totalPts + "/" + score.totalMaxPts + " points = " + score.percentScore + "%";
    return message;
}

async function generateGradeButton(courseBoxesArray){
    
    for (let courseBox of courseBoxesArray){

        let buttonContainer = courseBox.querySelector('.courseBox--assignments');
        
        if (buttonContainer){
            const button = document.createElement('button');
            button.innerText = 'See Grade';
            button.className = 'gradeButton';
    
            buttonContainer.appendChild(button);
    
            button.addEventListener('click', async (event) => {
                event.stopPropagation();
                event.preventDefault();
                if (button.innerText == 'See Grade'){
                    const message = await presentGradeScore(courseBox, button);
                    button.innerText = message;
                }
                else {
                    console.log("inner text not see grade");
                    button.innerText = 'See Grade';
                }
                
            });
        }
        else{
            console.log("no button container");
        }

        
    }
}


async function processRecentCourses(){

    const mostRecentTerm = document.querySelector('.courseList--coursesForTerm');
    if (mostRecentTerm) {
        const courseBoxes = mostRecentTerm.querySelectorAll('.courseBox');
        const courseBoxesArray = Array.from(courseBoxes);

        for (let i = courseBoxesArray.length - 1; i >= 0; i--){
            const courseBox = courseBoxesArray[i];
            if (!courseBox.querySelector('.courseBox--assignments')){
                courseBoxesArray.splice(i, 1);
            }
        }

        generateGradeButton(courseBoxesArray);
        presentGradePictures(courseBoxesArray);
        presentNearestDueDate(courseBoxesArray);

        
    }
}

async function processAllCourses(){
    const courseBoxes = document.querySelectorAll('.courseBox');
    const courseBoxesArray = Array.from(courseBoxes);

    for (let i = courseBoxesArray.length - 1; i >= 0; i--){
        const courseBox = courseBoxesArray[i];
        if (!courseBox.querySelector('.courseBox--assignments')){
            courseBoxesArray.splice(i, 1);
        }
    }

    generateGradeButton(courseBoxesArray);
    presentGradePictures(courseBoxesArray);
    presentNearestDueDate(courseBoxesArray);

}

async function processSingleCourse(){
    const courseBox = document.querySelector('.courseBox');
    const courseBoxArray = [courseBox];
    presentNearestDueDate(courseBoxArray);
}



//processSingleCourse();
//processRecentCourses();
processAllCourses();



