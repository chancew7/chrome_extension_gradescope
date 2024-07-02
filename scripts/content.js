
console.log("running content");


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


function determineScorePicture(score){

    console.log("score determined: "+score);

    if (score == 1){
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
        return "/pictures/fine.png";
    }
    else if (score >= .8){
        return "/pictures/slightlyWeird.png";
    }
    else if (score >= .75){
        return "/pictures/verySad.png";
    }
    else if (score >= .7){
        return "/pictures/superMessedUp.png";
    }
    else if (score >= .65){
        return "/pictures/scary.png";
    }
    else if (score >= .6){
        return "/pictures/veryWeird.png";
    }
    else {
        return "/pictures/over.png";
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
        const minutes = Math.floor((timeUntilDue % (1000 * 60 * 60)) / (1000 * 60));

        return `Next assignment: ${days} days, ${hours} hours, ${minutes} minutes`;
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
            img.src = determineScorePicture(score);
            img.style.width = '40px';
            img.style.height = '40px'
            courseBox.appendChild(img);

        }
    }
}

async function presentNearestDueDate(courseBoxesArray){
    for (const[index, courseBox] of courseBoxesArray.entries()){

        if (courseBox.href){

            const fullUrl = new URL(courseBox.href, window.location.origin);
            const date = await getTimeUntilNextAssignmentDue(fullUrl.href);

            const newDiv = document.createElement('div');
            newDiv.textContent = date;
            newDiv.className = 'customDiv';
            courseBox.appendChild(newDiv);
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

