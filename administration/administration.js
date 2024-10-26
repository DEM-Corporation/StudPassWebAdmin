const allGroups = [];

function loadGroups() {
    fetch('http://139.162.163.107:8080/api/v1/group/all', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(response => {
            allGroups = response.data;
        })
        .catch(error => {
            console.error('Error fetching groups:', error);
        });
}

function loadTeachers() {
    fetch('http://139.162.163.107:8080/api/v1/teacher/teachers')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(response => {
            const teachersList = document.getElementById('teachersList');
            teachersList.innerHTML = '';

            response.data.forEach(teacher => {
                console.log('Teacher: ', teacher);
                const teacherElement = document.createElement('div');

                teacherElement.innerHTML = `
                    <div class="cont">
                        <span class="user-name">${teacher.name}</span>
                        <button class="delete-btn" onclick='deleteTeacher("${teacher.id}")'>&#x1F5D1;</button>
                        <img src="../assets/delete_icon.svg" onclick='deleteTeacher("${teacher.id}")' style="cursor: pointer; width: 30px; height: 30px; border-radius: 50%;">
                    </div>
                `;
                teachersList.appendChild(teacherElement);
                allGroups.forEach(group => {
                    const groupElement = document.createElement('a');
                    groupElement.href = '#';
                    groupElement.textContent = group.name;
                    groupElement.classList.add('dropdown-item');
                    teacherElement.querySelector('.dropdown-menu').appendChild(groupElement);
                    groupElement.addEventListener('click', () => {
                        teacherElement.querySelector('.dropdown-btn').textContent = group.name;
                    });
                });
            });
        })
        .catch(error => {
            console.error('Error fetching teachers:', error);
        });
}
function assignGroup(teacherId, groupId) {
    fetch('http://139.162.163.107:8080/api/v1/teacher/assignGroup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(response => {
            console.log('Teacher deleted: ', response);
            loadTeachers();
        })
}
function deleteTeacher(id) {
    console.log('Deleting teacher with id: ', id);
    fetch(`http://139.162.163.107:8080/api/v1/teacher/delete?id=${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(response => {
            console.log('Teacher deleted:', response);
            loadTeachers();
        })
        .catch(error => {
            console.error('Error deleting teacher:', error);
        });
}
function stringToHash(string) {
    let hash = 0;
    if (string.length == 0) return hash;
    for (let i = 0; i < string.length; i++) {
        const char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
function generatePassword() {
    return Math.random().toString(36).slice(-6);
}
function generateEmail(name) {
    const hash = stringToHash(name);
    return `teacher${hash}@studpass.com`.toLowerCase();
}
function downloadExcelFile(data, fileName) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
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
        const teachers = XLSX.utils.sheet_to_json(sheet);

        const teacherData = []
        teachers.forEach((teacher) => {
            const name = teacher.name;
            const email = teacher.email;
            const groupId = teacher.groupId;
            const password = generatePassword();

            const teacherAuthDto = {
                email: email,
                groupId: groupId,
                name: name,
                password: password
            }
            fetch("http://139.162.163.107:8080/api/v1/auth/teacher/register", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(teacherAuthDto)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Teacher registered successfully: ', data);
                    teacherData.push({
                        name: name,
                        email: email,
                        password: password
                    });
                    if (teacherData.length == teachers.length) {
                        downloadExcelFile(teacherData, "Output teachers.xlsx")
                    }
                })
                .catch(error => {
                    console.error('Error registering teacher: ', error)
                });
        });
        loadTeachers();
    }
    reader.readAsArrayBuffer(file);
}

// Load teachers when the page loads
window.onload = loadTeachers();
