// ============================
// N-Suns Training Module
// ============================

let trainingWeeks = JSON.parse(localStorage.getItem('trainingWeeks')) || [];
let currentWeekId = null;

// N-Suns 5/3/1 LP Program Structure
const NSUNS_PROGRAMS = {
    workoutA: {
        name: 'Workout A - Bench / OHP',
        mainLift: 'Bench Press',
        secondaryLift: 'Overhead Press',
        exercises: [
            // Main Lift - Bench Press (T1)
            { name: 'Bench Press', sets: 9, type: 'main', reps: [5, 3, 1, 3, 3, 3, 5, 5, '5+'], percentages: [75, 85, 95, 90, 85, 80, 75, 70, 65] },
            // Secondary Lift - OHP (T2)
            { name: 'Overhead Press', sets: 8, type: 'secondary', reps: [6, 5, 3, 5, 7, 4, 6, 8], percentages: [50, 60, 70, 70, 70, 70, 65, 60] },
            // Accessories
            { name: 'Accessory 1', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null },
            { name: 'Accessory 2', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null },
            { name: 'Accessory 3', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null }
        ]
    },
    workoutB: {
        name: 'Workout B - Squat / Sumo DL',
        mainLift: 'Squat',
        secondaryLift: 'Sumo Deadlift',
        exercises: [
            // Main Lift - Squat (T1)
            { name: 'Squat', sets: 9, type: 'main', reps: [5, 3, 1, 3, 3, 3, 5, 5, '5+'], percentages: [75, 85, 95, 90, 85, 80, 75, 70, 65] },
            // Secondary Lift - Sumo Deadlift (T2)
            { name: 'Sumo Deadlift', sets: 8, type: 'secondary', reps: [5, 5, 3, 5, 7, 4, 6, 8], percentages: [50, 60, 70, 70, 70, 70, 65, 60] },
            // Accessories
            { name: 'Accessory 1', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null },
            { name: 'Accessory 2', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null },
            { name: 'Accessory 3', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null }
        ]
    },
    workoutC: {
        name: 'Workout C - OHP / Incline',
        mainLift: 'Overhead Press',
        secondaryLift: 'Incline Bench',
        exercises: [
            // Main Lift - OHP (T1)
            { name: 'Overhead Press', sets: 9, type: 'main', reps: [5, 3, 1, 3, 3, 3, 5, 5, '5+'], percentages: [75, 85, 95, 90, 85, 80, 75, 70, 65] },
            // Secondary Lift - Incline Bench (T2)
            { name: 'Incline Bench', sets: 8, type: 'secondary', reps: [6, 5, 3, 5, 7, 4, 6, 8], percentages: [50, 60, 70, 70, 70, 70, 65, 60] },
            // Accessories
            { name: 'Accessory 1', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null },
            { name: 'Accessory 2', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null },
            { name: 'Accessory 3', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null }
        ]
    },
    workoutD: {
        name: 'Workout D - Deadlift / Front Squat',
        mainLift: 'Deadlift',
        secondaryLift: 'Front Squat',
        exercises: [
            // Main Lift - Deadlift (T1)
            { name: 'Deadlift', sets: 9, type: 'main', reps: [5, 3, 1, 3, 3, 3, 3, 3, '3+'], percentages: [75, 85, 95, 90, 85, 80, 75, 70, 65] },
            // Secondary Lift - Front Squat (T2)
            { name: 'Front Squat', sets: 8, type: 'secondary', reps: [5, 5, 3, 5, 7, 4, 6, 8], percentages: [35, 45, 55, 55, 55, 55, 50, 45] },
            // Accessories
            { name: 'Accessory 1', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null },
            { name: 'Accessory 2', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null },
            { name: 'Accessory 3', sets: 4, type: 'accessory', reps: ['8-12', '8-12', '8-12', '8-12'], percentages: null }
        ]
    }
};

export function getTrainingWeeks() {
    return trainingWeeks;
}

export function getCurrentWeekId() {
    return currentWeekId;
}

export function setCurrentWeekId(id) {
    currentWeekId = id;
}

export function createNewTrainingWeek(trainingMaxes = null) {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Default training maxes if not provided
    const defaultTMs = {
        bench: 60,
        squat: 80,
        ohp: 40,
        deadlift: 100
    };

    const tms = trainingMaxes || defaultTMs;

    const newWeek = {
        id: Date.now(),
        startDate: dateString,
        trainingMaxes: tms,
        workouts: {
            a: createWorkoutData('workoutA', tms),
            b: createWorkoutData('workoutB', tms),
            c: createWorkoutData('workoutC', tms),
            d: createWorkoutData('workoutD', tms)
        },
        completedExercises: 0,
        totalExercises: calculateTotalSets(),
        percentage: 0
    };

    trainingWeeks.push(newWeek);
    saveTrainingWeeks();
    return newWeek;
}

function createWorkoutData(workoutKey, tms) {
    const template = NSUNS_PROGRAMS[workoutKey];

    return {
        name: template.name,
        exercises: template.exercises.map(ex => {
            const tmKey = getTMKey(ex.name);
            const tm = tmKey ? tms[tmKey] : null;

            return {
                name: ex.name,
                type: ex.type,
                sets: ex.reps.map((rep, idx) => ({
                    targetReps: rep,
                    targetWeight: tm && ex.percentages ? Math.round(tm * ex.percentages[idx] / 100 / 2.5) * 2.5 : null,
                    percentage: ex.percentages ? ex.percentages[idx] : null,
                    actualReps: null,
                    actualWeight: null,
                    completed: false
                }))
            };
        })
    };
}

function getTMKey(exerciseName) {
    const nameMap = {
        'Bench Press': 'bench',
        'Overhead Press': 'ohp',
        'Squat': 'squat',
        'Deadlift': 'deadlift',
        'Sumo Deadlift': 'deadlift',
        'Incline Bench': 'bench',
        'Front Squat': 'squat'
    };
    return nameMap[exerciseName] || null;
}

function calculateTotalSets() {
    let total = 0;
    Object.values(NSUNS_PROGRAMS).forEach(workout => {
        workout.exercises.forEach(ex => {
            total += ex.sets;
        });
    });
    return total;
}

export function toggleSetCompletion(weekId, workoutKey, exerciseIndex, setIndex) {
    const week = trainingWeeks.find(w => w.id === weekId);
    if (!week) return;

    const set = week.workouts[workoutKey].exercises[exerciseIndex].sets[setIndex];
    set.completed = !set.completed;

    // Recalculate progress
    updateWeekProgress(week);
    saveTrainingWeeks();
}

export function updateSetData(weekId, workoutKey, exerciseIndex, setIndex, actualReps, actualWeight) {
    const week = trainingWeeks.find(w => w.id === weekId);
    if (!week) return;

    const set = week.workouts[workoutKey].exercises[exerciseIndex].sets[setIndex];
    set.actualReps = actualReps;
    set.actualWeight = actualWeight;

    saveTrainingWeeks();
}

function updateWeekProgress(week) {
    let completed = 0;
    let total = 0;

    Object.values(week.workouts).forEach(workout => {
        workout.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                total++;
                if (set.completed) completed++;
            });
        });
    });

    week.completedExercises = completed;
    week.totalExercises = total;
    week.percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function updateTrainingMax(weekId, lift, newTM) {
    const week = trainingWeeks.find(w => w.id === weekId);
    if (!week) return;

    week.trainingMaxes[lift] = newTM;

    // Recalculate weights for affected exercises
    Object.keys(week.workouts).forEach(workoutKey => {
        const workout = week.workouts[workoutKey];
        workout.exercises.forEach((exercise, exIdx) => {
            const tmKey = getTMKey(exercise.name);
            if (tmKey === lift) {
                const template = NSUNS_PROGRAMS[workoutKey].exercises[exIdx];
                exercise.sets.forEach((set, setIdx) => {
                    if (template.percentages && template.percentages[setIdx]) {
                        set.targetWeight = Math.round(newTM * template.percentages[setIdx] / 100 / 2.5) * 2.5;
                    }
                });
            }
        });
    });

    saveTrainingWeeks();
}

export function displayTrainingWeeks(weeksList, onWeekClick) {
    if (trainingWeeks.length === 0) {
        weeksList.innerHTML = '<p class="empty-state">Noch keine Trainingswochen.<br/>Tippe auf + um zu starten.</p>';
        return;
    }

    // Newest first
    const sortedWeeks = [...trainingWeeks].sort((a, b) => b.id - a.id);

    weeksList.innerHTML = sortedWeeks.map(week => {
        const date = new Date(week.startDate);
        const formattedDate = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        return `
            <div class="week-card-wrapper" data-week-id="${week.id}">
                <div class="week-delete-bg">
                    <button class="week-delete-btn" data-week-id="${week.id}">Löschen</button>
                </div>
                <div class="week-card" data-week-id="${week.id}">
                    <div class="week-date">${formattedDate}</div>
                    <div class="week-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${week.percentage}%"></div>
                        </div>
                        <div class="progress-text">${week.completedExercises}/${week.totalExercises} Sets (${week.percentage}%)</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners
    addWeekSwipeEvents(weeksList);

    weeksList.querySelectorAll('.week-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const weekId = parseInt(card.dataset.weekId);
            if (onWeekClick) onWeekClick(weekId);
        });
    });

    weeksList.querySelectorAll('.week-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const weekId = parseInt(btn.dataset.weekId);
            deleteTrainingWeek(weekId);
            displayTrainingWeeks(weeksList, onWeekClick);
        });
    });
}

function addWeekSwipeEvents(container) {
    container.querySelectorAll('.week-card-wrapper').forEach(wrapper => {
        const weekCard = wrapper.querySelector('.week-card');

        let startX = 0;
        let currentX = 0;
        let translateX = 0;
        let isSwiping = false;

        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            currentX = startX;
            isSwiping = true;
            weekCard.classList.add('swiping');
        };

        const handleTouchMove = (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX;
            translateX = Math.min(0, currentX - startX);
            weekCard.style.transform = `translateX(${translateX}px)`;
        };

        const handleTouchEnd = () => {
            if (!isSwiping) return;
            isSwiping = false;
            weekCard.classList.remove('swiping');

            if (translateX < -80) {
                weekCard.style.transition = 'transform 0.2s ease-out';
                weekCard.style.transform = 'translateX(-100px)';
            } else {
                weekCard.style.transition = 'transform 0.2s ease-out';
                weekCard.style.transform = 'translateX(0)';
            }
        };

        weekCard.addEventListener('touchstart', handleTouchStart, { passive: true });
        weekCard.addEventListener('touchmove', handleTouchMove, { passive: true });
        weekCard.addEventListener('touchend', handleTouchEnd);
    });
}

export function deleteTrainingWeek(weekId) {
    trainingWeeks = trainingWeeks.filter(w => w.id !== weekId);
    saveTrainingWeeks();
}

export function renderWorkoutDetail(week, workoutKey, container, onSetToggle, onSetEdit) {
    const workout = week.workouts[workoutKey];

    container.innerHTML = `
        <div class="workout-detail">
            <div class="tm-display">
                <h4>Training Maxes</h4>
                <div class="tm-values">
                    <span class="tm-item">Bench: ${week.trainingMaxes.bench}kg</span>
                    <span class="tm-item">Squat: ${week.trainingMaxes.squat}kg</span>
                    <span class="tm-item">OHP: ${week.trainingMaxes.ohp}kg</span>
                    <span class="tm-item">DL: ${week.trainingMaxes.deadlift}kg</span>
                </div>
            </div>

            ${workout.exercises.map((exercise, exIdx) => `
                <div class="exercise-card ${exercise.type}">
                    <div class="exercise-header">
                        <h3>${exercise.name}</h3>
                        <span class="exercise-type-badge ${exercise.type}">${getTypeLabel(exercise.type)}</span>
                    </div>
                    <div class="sets-container">
                        ${exercise.sets.map((set, setIdx) => `
                            <div class="set-row ${set.completed ? 'completed' : ''}"
                                 data-exercise="${exIdx}"
                                 data-set="${setIdx}">
                                <div class="set-number">Set ${setIdx + 1}</div>
                                <div class="set-target">
                                    ${set.targetWeight ? `${set.targetWeight}kg` : '-'}
                                    × ${set.targetReps}
                                    ${set.percentage ? `<span class="percentage">(${set.percentage}%)</span>` : ''}
                                </div>
                                <div class="set-actual">
                                    <input type="number"
                                           class="actual-weight"
                                           placeholder="kg"
                                           value="${set.actualWeight || ''}"
                                           data-exercise="${exIdx}"
                                           data-set="${setIdx}">
                                    <span>×</span>
                                    <input type="number"
                                           class="actual-reps"
                                           placeholder="reps"
                                           value="${set.actualReps || ''}"
                                           data-exercise="${exIdx}"
                                           data-set="${setIdx}">
                                </div>
                                <button class="set-complete-btn ${set.completed ? 'done' : ''}"
                                        data-exercise="${exIdx}"
                                        data-set="${setIdx}">
                                    ${set.completed ? '✓' : '○'}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add event listeners
    container.querySelectorAll('.set-complete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const exIdx = parseInt(btn.dataset.exercise);
            const setIdx = parseInt(btn.dataset.set);
            if (onSetToggle) onSetToggle(exIdx, setIdx);
        });
    });

    container.querySelectorAll('.actual-weight, .actual-reps').forEach(input => {
        input.addEventListener('change', (e) => {
            const exIdx = parseInt(e.target.dataset.exercise);
            const setIdx = parseInt(e.target.dataset.set);
            const row = e.target.closest('.set-row');
            const weightInput = row.querySelector('.actual-weight');
            const repsInput = row.querySelector('.actual-reps');

            if (onSetEdit) {
                onSetEdit(exIdx, setIdx,
                    repsInput.value ? parseInt(repsInput.value) : null,
                    weightInput.value ? parseFloat(weightInput.value) : null
                );
            }
        });
    });
}

function getTypeLabel(type) {
    switch(type) {
        case 'main': return 'T1';
        case 'secondary': return 'T2';
        case 'accessory': return 'Accessory';
        default: return type;
    }
}

export function saveTrainingWeeks() {
    localStorage.setItem('trainingWeeks', JSON.stringify(trainingWeeks));
}

// For backup/restore
export function setTrainingWeeks(newWeeks) {
    trainingWeeks = newWeeks;
    localStorage.setItem('trainingWeeks', JSON.stringify(trainingWeeks));
}

export function exportTrainingWeeks() {
    return trainingWeeks;
}

export function getWeekById(weekId) {
    return trainingWeeks.find(w => w.id === weekId);
}
