
document.addEventListener('DOMContentLoaded', () => {
    const noteInput = document.getElementById('noteInput');
    const noteContainer = document.getElementById('noteContainer');

    // ローカルストレージからメモを読み込む
    loadNotes();

    noteInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            createNote();
        }
    });

    function createNote() {
        const noteText = noteInput.value.trim();
        if (noteText === '') return;

        const note = document.createElement('div');
        note.className = 'note';

        const closeButton = document.createElement('button');
        closeButton.className = 'close-btn';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => {
            note.remove();
            saveNotes();
        });

        const noteContent = document.createElement('div');
        noteContent.className = 'note-content';
        noteContent.textContent = noteText;

        note.appendChild(closeButton);
        note.appendChild(noteContent);
        noteContainer.appendChild(note);

        noteInput.value = '';

        placeNoteInNonOverlappingPosition(note);
        makeDraggable(note);
        saveNotes();
    }

    function makeDraggable(element) {
        let shiftX, shiftY;

        element.addEventListener('mousedown', onMouseDown);
        element.addEventListener('touchstart', onTouchStart);

        function onMouseDown(event) {
            event.preventDefault();
            shiftX = event.clientX - element.getBoundingClientRect().left;
            shiftY = event.clientY - element.getBoundingClientRect().top;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveNotes();
        }

        function onTouchStart(event) {
            shiftX = event.touches[0].clientX - element.getBoundingClientRect().left;
            shiftY = event.touches[0].clientY - element.getBoundingClientRect().top;

            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', onTouchEnd);
        }

        function onTouchMove(event) {
            moveAt(event.touches[0].pageX, event.touches[0].pageY);
        }

        function onTouchEnd() {
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            saveNotes();
        }

        function moveAt(pageX, pageY) {
            element.style.left = pageX - shiftX + 'px';
            element.style.top = pageY - shiftY + 'px';
        }

        element.ondragstart = () => false;

        // 付箋のリサイズハンドルのサイズを大きくして操作しやすくする
        element.style.resize = 'both';
        element.style.overflow = 'hidden';
        const resizeHandle = document.createElement('div');
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.right = '0';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.width = '20px';
        resizeHandle.style.height = '20px';
        resizeHandle.style.cursor = 'se-resize';
        resizeHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        resizeHandle.style.borderRadius = '50%';
        element.appendChild(resizeHandle);

        resizeHandle.addEventListener('mousedown', onResizeMouseDown);

        function onResizeMouseDown(event) {
            event.preventDefault();
            document.addEventListener('mousemove', onResizeMouseMove);
            document.addEventListener('mouseup', onResizeMouseUp);
        }

        function onResizeMouseMove(event) {
            element.style.width = event.pageX - element.getBoundingClientRect().left + 'px';
            element.style.height = event.pageY - element.getBoundingClientRect().top + 'px';
            element.querySelector('.note-content').style.fontSize = 'calc(10px + 1vw)'; // 文字サイズも変更
            saveNotes();
        }

        function onResizeMouseUp() {
            document.removeEventListener('mousemove', onResizeMouseMove);
            document.removeEventListener('mouseup', onResizeMouseUp);
            saveNotes();
        }
    }

    function saveNotes() {
        const notes = [];
        document.querySelectorAll('.note').forEach(note => {
            const noteContent = note.querySelector('.note-content').textContent;
            const rect = note.getBoundingClientRect();
            notes.push({
                text: noteContent,
                top: note.style.top,
                left: note.style.left,
                width: note.style.width,
                height: note.style.height
            });
        });
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function loadNotes() {
        const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        savedNotes.forEach(noteData => {
            const note = document.createElement('div');
            note.className = 'note';
            note.style.top = noteData.top;
            note.style.left = noteData.left;
            note.style.width = noteData.width;
            note.style.height = noteData.height;

            const closeButton = document.createElement('button');
            closeButton.className = 'close-btn';
            closeButton.textContent = '×';
            closeButton.addEventListener('click', () => {
                note.remove();
                saveNotes();
            });

            const noteContent = document.createElement('div');
            noteContent.className = 'note-content';
            noteContent.textContent = noteData.text;

            note.appendChild(closeButton);
            note.appendChild(noteContent);
            noteContainer.appendChild(note);

            makeDraggable(note);
        });
    }

    function placeNoteInNonOverlappingPosition(note) {
        const noteRect = note.getBoundingClientRect();
        const margin = 10; // 付箋同士の余白

        let posX = margin;
        let posY = margin;

        const checkOverlap = (x, y) => {
            for (const existingNote of document.querySelectorAll('.note')) {
                const existingRect = existingNote.getBoundingClientRect();
                if (x < existingRect.right + margin &&
                    x + noteRect.width > existingRect.left - margin &&
                    y < existingRect.bottom + margin &&
                    y + noteRect.height > existingRect.top - margin) {
                    return true;
                }
            }
            return false;
        };

        while (checkOverlap(posX, posY)) {
            posX += margin;
            posY += margin;

            if (posY + noteRect.height > window.innerHeight) {
                posY = margin;
                posX += noteRect.width + margin;
            }

            if (posX + noteRect.width > window.innerWidth) {
                posX = margin;
                posY = margin;
            }
        }

        note.style.left = posX + 'px';
        note.style.top = posY + 'px';
    }
});

