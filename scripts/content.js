


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

        for (let i = 0; i < scoreElements.length; i++){
            const scoreElement = scoreElements[i];
            const scoreInfo = scoreElement.textContent.trim();
            const pts = parseFloat(scoreInfo.split('/')[0].trim());
            const maxPts = parseFloat(scoreInfo.split('/')[1].trim());
            totalPts += pts;
            totalMaxPts += maxPts;
        }
        return totalPts / totalMaxPts;
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

        if (statusText != "No Submission"){
            gradedAssignmentExists = true;
        }
    }
    return false;
}

async function determineScorePicture(score, url){

    const gradedAssignmentExistsVar = await gradedAssignmentExists(url);

    if (!gradedAssignmentExistsVar){
        return chrome.runtime.getURL("/pictures/start.png");
    }
    else if (score == 1){
        return chrome.runtime.getURL("/pictures/drake.png");
    }
    else if (score >= .97){
        return chrome.runtime.getURL("/pictures/cool.png");
    }
    else if (score >= .94){
        return chrome.runtime.getURL("/pictures/incredible.png");
    }
    else if (score >= .9){
        return chrome.runtime.getURL("/pictures/normal.png");
    }
    else if (score >= .85){
        return chrome.runtime.getURL("/pictures/fine.png");
    }
    else if (score >= .8){
        return chrome.runtime.getURL("/pictures/slightlyWeird.png");
    }
    else if (score >= .75){
        return chrome.runtime.getURL("/pictures/verySad.png");
    }
    else if (score >= .7){
        return chrome.runtime.getURL("/pictures/superMessedUp.png");
    }
    else if (score >= .65){
        return chrome.runtime.getURL("/pictures/scary.png");
    }
    else if (score >= .6){
        return chrome.runtime.getURL("/pictures/veryWeird.png");
    }
    else {
        return chrome.runtime.getURL("/pictures/over.png");
    }
}

async function getTimeUntilNextAssignmentDue(url){

    const doc = await getDoc(url);

    const dueDateElements = doc.querySelectorAll('.submissionTimeChart--dueDate');
    const dueDatesArray = Array.from(dueDateElements).map(element => new Date(element.getAttribute('datetime')));

    const now = new Date();
    let nearestDate = null;
    let minDiff = Infinity;

    dueDatesArray.forEach(dueDate => {
        const diff = dueDate.getTime() - now.getTime(); // Convert to milliseconds and calculate the difference
        if (diff > 0 && diff < minDiff) {
            nearestDate = dueDate;
            minDiff = diff;
        }
    });
   
    if (nearestDate) {
        const timeUntilDue = nearestDate - now;
        const days = Math.floor(timeUntilDue / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeUntilDue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return `Next assignment: ${days} days, ${hours} hours`;
    } else {
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

            courseBox.appendChild(imgContainer);

        }
    }
}


async function presentNearestDueDate(courseBoxesArray){
    for (const[index, courseBox] of courseBoxesArray.entries()){

        if (courseBox.href){

            const fullUrl = new URL(courseBox.href, window.location.origin);
            const date = await getTimeUntilNextAssignmentDue(fullUrl.href);

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
    }
}


async function processCourses(){

    const mostRecentTerm = document.querySelector('.courseList--coursesForTerm');
    if (mostRecentTerm) {
        const courseBoxes = mostRecentTerm.querySelectorAll('.courseBox');
        const courseBoxesArray = Array.from(courseBoxes).slice(0,-1);

        presentGradePictures(courseBoxesArray);
        presentNearestDueDate(courseBoxesArray);

        
    }
}

processCourses();

