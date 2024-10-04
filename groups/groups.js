
window.onload = loadGroups();

function loadGroups() {
    // Fetch all groups from the backend API
    fetch('http://139.162.163.107:8080/api/v1/group/all')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(responseData => {
        console.log('Response received:', responseData);

        if (responseData.code === 200 && responseData.data) {
            const groups = responseData.data;
            const groupList = document.getElementById('groupList');
            groupList.innerHTML = '';

            groups.forEach(group => {
                const groupElement = document.createElement('div');
                groupElement.className = 'link-block';
                groupElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <a href="../group/group.html?id=${group.id}" style="text-decoration: none; color: inherit;">
                            <p>${group.name}</p>
                        </a>
                        <img src="../assets/delete_icon.svg" alt="Delete" style="cursor: pointer;" onclick="deleteGroup(${group.id})">
                    </div>
                `;
                

                groupList.appendChild(groupElement);
            });
        } else {
            console.error('Error: No groups found or invalid response format');
        }
    })
    .catch(error => console.error('Error fetching groups:', error));
}

function deleteGroup(groupId) {
    fetch(`http://139.162.163.107:8080/api/v1/group/delete?groupId=${groupId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(responseData => {
        console.log('Response received:', responseData);
        if (responseData.code === 200) {
            loadGroups();
            alert('Group deleted successfully');
        }
    })
}

function showDialog() {
    document.getElementById('createGroupDialog').showModal();
}

function createGroup(event) {
    event.preventDefault();

    const groupName = document.getElementById('groupName').value;
    const dialog = document.getElementById('createGroupDialog');

    if (!groupName) {
        alert('Please enter a group name');
        return;
    }
    const groupInputDto = {
        name: groupName
    };
    console.log(groupInputDto);

    fetch('http://139.162.163.107:8080/api/v1/group/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupInputDto)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(responseData => {
        console.log('Response received:', responseData);
        if (responseData.code === 200 && responseData.data) {
            const groupOutputDto = responseData.data;
            document.getElementById('groupName').value = ''; // Clear input field
            loadGroups(); // Refresh the group list
            alert(`Group "${groupOutputDto.name}" created successfully with ID: ${groupOutputDto.id}`);
            dialog.close();
        } else {
            console.log("Code: " + responseData.code);
            console.error('Error: Invalid response format');
            alert('Failed to create group. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error creating group:', error);
    });
}

function closeDialog() {
    const dialog = document.getElementById('createGroupDialog');
    dialog.close();
}