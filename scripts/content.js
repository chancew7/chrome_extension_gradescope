console.log("running content");


const classUrls = []

function getMostRecentScore(url){
    return 1;
}

function determineScorePicture(score){
    return "";
}

function getTimeUntilNextAssignmentDue(url){
    return 1;
}


const mostRecentTerm = document.querySelector('.courseList--coursesForTerm');

if (mostRecentTerm) {
    const courseBoxes = mostRecentTerm.querySelectorAll('.courseBox');
    const courseBoxesArray = Array.from(courseBoxes).slice(0,-1);

    courseBoxesArray.forEach((courseBox, index) => {

        classUrls.push(courseBox.href);

        const img = document.createElement('img');

        img.src = 'https://thefirstyearblog.com/wp-content/uploads/2020/05/Chocolate-Chip-Muffins-2023-Square.png'
        img.style.width = '40px';
        img.style.height = '40px'
        courseBox.appendChild(img);

        const newDiv = document.createElement('div');
        newDiv.textContent = `Class ${index + 1}`;
        newDiv.className = 'customDiv';
        courseBox.appendChild(newDiv);


    });
}



