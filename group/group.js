const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('id');
window.onload = loadStudents();


function loadStudents() {
    if (groupId) {
        // Fetch students for the specific group
        fetch(`http://139.162.163.107:8080/api/v1/group/students?groupId=${groupId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(responseData => {
                console.log('Response received:', responseData);

                if (responseData.code === 200 && responseData.data) {
                    const students = responseData.data;
                    const studentList = document.getElementById('studentList');
                    studentList.innerHTML = '';

                    students.forEach(student => {
                        const studentElement = document.createElement('div');
                        studentElement.className = 'link-block';
                        studentElement.style = "width: 25%;"

                        studentElement.innerHTML = `
                            <div> 
                                <strong>${student.name}</strong><br>
                                <p class="groupName" style="margin: 0px;margin-top:5px;">${student.group.name || 'N/A'}</p>
                            </div>
                            <img onclick='deleteStudent("${student.id}")' src="../assets/delete_icon.svg" style="cursor: pointer; width: 30px; height: 30px; border-radius: 50%;">
                        `

                        studentList.appendChild(studentElement);
                    });
                } else {
                    console.error('Error: No students found or invalid response format');
                }
            })
            .catch(error => console.error('Error fetching students:', error));
    } else {
        console.error('Error: No group ID provided in the URL');
    }
}

function stringToHash(string) {
    let hash = 0;
    if (string.length == 0) return hash;
    for (let i = 0; i < string.length; i++) {
        const char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash); // Ensure positive hash value for email generation
}

// Function to generate a random 6-digit password
function generatePassword() {
    return Math.random().toString(36).slice(-6);
}

// Function to generate an email based on the student's name
function generateEmail(name, group) {
    const hash = stringToHash(name) + stringToHash(group) // Generate a string hash from characters
    return `student${hash}@studpass.com`.toLowerCase();
}

function downloadExcelFile(data, fileName) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, fileName);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const students = XLSX.utils.sheet_to_json(sheet);

        const studentData = []

        students.forEach((student, i) => {
            const name = student.name;
            const surname = student.surname;
            const email = generateEmail(name + surname, groupId);
            const password = generatePassword();
            const profile_image_url = "";

            const studentAuthDto = {
                email: email,
                groupId: parseInt(groupId),
                name: (name + ' ' + surname),
                password: password,
                profileImageUrl: profile_image_url
            };

            fetch("http://139.162.163.107:8080/api/v1/auth/student/register", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentAuthDto)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.code == 200) {
                        studentData.push({
                            name: name + ' ' + surname,
                            group: groupId,
                            email: email,
                            password: password
                        });
                    }
                    if (i == students.length - 1) {
                        downloadExcelFile(studentData, "Output students.xlsx")
                    }
                })
                .catch(error => {
                    console.error('Error registering student:', error);
                });
        });
        loadStudents();
    }
    reader.readAsArrayBuffer(file);
}

function deleteStudent(studentId) {
    fetch(`http://139.162.163.107:8080/api/v1/student/delete?id=${studentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            } else {
                alert('Student deleted successfully');
                loadStudents();
            }
        })
        .catch(error => {
            console.error('Error deleting student:', error);
        });
}