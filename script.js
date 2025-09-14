class TrainingPlanner {
    constructor() {
        this.workoutTypes = [];
        this.workoutHistory = [];
        this.currentSplit = [];
        this.nextWorkoutIndex = 0;
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.renderUI();
    }

    bindEvents() {
        document.getElementById('setSplit').addEventListener('click', () => {
            this.setSplit();
        });

        document.getElementById('splitInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setSplit();
            }
        });

        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });

        document.getElementById('completeNextWorkout').addEventListener('click', () => {
            const nextWorkout = this.getNextWorkout();
            if (nextWorkout && nextWorkout !== 'Configure your split first') {
                this.completeWorkout(nextWorkout);
            }
        });
    }

    setSplit() {
        const input = document.getElementById('splitInput');
        const splitText = input.value.trim();
        
        if (!splitText) {
            alert('Please enter your workout types');
            return;
        }

        this.workoutTypes = splitText.split(',').map(type => type.trim()).filter(type => type);
        
        if (this.workoutTypes.length === 0) {
            alert('Please enter valid workout types');
            return;
        }

        // Reset the cycle
        this.nextWorkoutIndex = 0;
        
        this.saveData();
        this.renderUI();
        
        input.value = '';
        
        // Show success feedback
        const button = document.getElementById('setSplit');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Split Set!';
        button.classList.add('btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('btn-success');
        }, 2000);
    }

    completeWorkout(workoutType) {
        const now = new Date();
        
        // Add to history
        this.workoutHistory.unshift({
            type: workoutType,
            date: now.toISOString(),
            timestamp: now.getTime()
        });

        // Move to next workout in the cycle
        const currentIndex = this.workoutTypes.indexOf(workoutType);
        if (currentIndex !== -1) {
            this.nextWorkoutIndex = (currentIndex + 1) % this.workoutTypes.length;
        }

        // Keep only last 50 workouts
        if (this.workoutHistory.length > 50) {
            this.workoutHistory = this.workoutHistory.slice(0, 50);
        }

        this.saveData();
        this.renderUI();
        
        // Show completion feedback
        this.showCompletionFeedback(workoutType);
    }

    showCompletionFeedback(workoutType) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
            z-index: 1000;
            animation: slideInMobile 0.3s ease;
            max-width: 90vw;
            text-align: center;
            font-weight: 500;
        `;
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i> 
            ${workoutType} completed!
        `;
        
        document.body.appendChild(notification);
        
        // Add haptic feedback for mobile devices
        if ('vibrate' in navigator) {
            navigator.vibrate(100);
        }
        
        setTimeout(() => {
            notification.style.animation = 'slideOutMobile 0.3s ease forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2500);
    }

    getDaysSinceLastWorkout(workoutType) {
        const lastWorkout = this.workoutHistory.find(workout => workout.type === workoutType);
        
        if (!lastWorkout) {
            return null;
        }
        
        const now = new Date();
        const lastDate = new Date(lastWorkout.date);
        const diffTime = Math.abs(now - lastDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    getCurrentStreak() {
        if (this.workoutHistory.length === 0) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = 0;
        let currentDate = new Date(today);
        
        for (let i = 0; i < this.workoutHistory.length; i++) {
            const workoutDate = new Date(this.workoutHistory[i].date);
            workoutDate.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 0) {
                // Workout on current day
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (daysDiff === 1 && streak === 0) {
                // No workout today, but workout yesterday
                streak++;
                currentDate = new Date(workoutDate);
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (daysDiff === 1) {
                // Workout on previous day
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                // Gap in workouts
                break;
            }
        }
        
        return streak;
    }

    getNextWorkout() {
        if (this.workoutTypes.length === 0) {
            return 'Configure your split first';
        }
        
        return this.workoutTypes[this.nextWorkoutIndex];
    }

    renderUI() {
        this.toggleSectionsVisibility();
        this.renderNextWorkout();
        this.renderStreak();
        this.renderWorkoutGrid();
        this.renderHistory();
        this.renderStats();
    }

    toggleSectionsVisibility() {
        const hasWorkoutTypes = this.workoutTypes.length > 0;
        
        // Get all sections except the split config
        const statusSection = document.querySelector('.status-section');
        const workoutSection = document.querySelector('.workout-section');
        const historySection = document.querySelector('.history-section');
        const statsSection = document.querySelector('.stats-section');
        
        // Show/hide sections based on whether split is configured
        const display = hasWorkoutTypes ? 'block' : 'none';
        
        if (statusSection) statusSection.style.display = display;
        if (workoutSection) workoutSection.style.display = display;
        if (historySection) historySection.style.display = display;
        if (statsSection) statsSection.style.display = display;
        
        // Update the split config section styling for initial setup
        const splitSection = document.querySelector('.split-config');
        if (splitSection) {
            if (!hasWorkoutTypes) {
                // Make it more prominent when it's the only thing showing
                splitSection.style.marginTop = '40px';
                splitSection.querySelector('h2').textContent = '🏋️ Welcome! Set Up Your Workout Split';
            } else {
                // Normal styling when other sections are visible
                splitSection.style.marginTop = '';
                splitSection.querySelector('h2').innerHTML = '<i class="fas fa-cog"></i> Configure Your Split';
            }
        }
    }

    renderNextWorkout() {
        const nextWorkoutElement = document.getElementById('nextWorkout');
        const nextWorkoutInfoElement = document.getElementById('nextWorkoutInfo');
        const completeNextWorkoutButton = document.getElementById('completeNextWorkout');
        const nextWorkout = this.getNextWorkout();
        
        nextWorkoutElement.textContent = nextWorkout;
        
        if (nextWorkout === 'Configure your split first' || this.workoutTypes.length === 0) {
            nextWorkoutInfoElement.style.display = 'none';
            completeNextWorkoutButton.style.display = 'none';
        } else {
            const daysSince = this.getDaysSinceLastWorkout(nextWorkout);
            
            let daysSinceText = 'Never completed';
            let infoClass = '';
            
            if (daysSince !== null) {
                if (daysSince === 0) {
                    daysSinceText = 'Completed today';
                } else if (daysSince === 1) {
                    daysSinceText = 'Completed yesterday';
                } else {
                    daysSinceText = `${daysSince} days ago`;
                    if (daysSince > 7) {
                        infoClass = 'overdue';
                    }
                }
            }
            
            nextWorkoutInfoElement.textContent = daysSinceText;
            nextWorkoutInfoElement.className = `next-workout-info ${infoClass}`;
            nextWorkoutInfoElement.style.display = 'block';
            completeNextWorkoutButton.style.display = 'block';
        }
    }

    renderStreak() {
        const streakElement = document.getElementById('currentStreak');
        const streak = this.getCurrentStreak();
        streakElement.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
    }

    renderWorkoutGrid() {
        const grid = document.getElementById('workoutGrid');
        
        if (this.workoutTypes.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dumbbell"></i>
                    <p>Set up your workout split to start tracking</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.workoutTypes.map(workoutType => {
            const daysSince = this.getDaysSinceLastWorkout(workoutType);
            const isNext = workoutType === this.getNextWorkout();
            
            let daysSinceText = 'Never completed';
            let daysSinceClass = '';
            
            if (daysSince !== null) {
                if (daysSince === 0) {
                    daysSinceText = 'Completed today';
                } else if (daysSince === 1) {
                    daysSinceText = 'Completed yesterday';
                } else {
                    daysSinceText = `${daysSince} days ago`;
                    if (daysSince > 7) {
                        daysSinceClass = 'overdue';
                    }
                }
            }

            return `
                <div class="workout-card ${isNext ? 'next-workout' : ''}">
                    <h3>
                        ${workoutType}
                        ${isNext ? '<i class="fas fa-arrow-right" style="color: #667eea; margin-left: 8px;"></i>' : ''}
                    </h3>
                    <div class="days-since ${daysSinceClass}">${daysSinceText}</div>
                    <button class="btn btn-success" onclick="planner.completeWorkout('${workoutType}')">
                        <i class="fas fa-check"></i> Complete Workout
                    </button>
                </div>
            `;
        }).join('');
    }

    renderHistory() {
        const historyElement = document.getElementById('workoutHistory');
        
        if (this.workoutHistory.length === 0) {
            historyElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No workouts completed yet</p>
                </div>
            `;
            return;
        }

        historyElement.innerHTML = this.workoutHistory.slice(0, 10).map(workout => {
            const date = new Date(workout.date);
            const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="history-item">
                    <div class="history-workout">
                        <i class="fas fa-dumbbell" style="margin-right: 8px; color: #667eea;"></i>
                        ${workout.type}
                    </div>
                    <div class="history-date">${dateStr} at ${timeStr}</div>
                </div>
            `;
        }).join('');
    }

    renderStats() {
        const statsGrid = document.getElementById('statsGrid');
        
        if (this.workoutHistory.length === 0) {
            statsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>Complete some workouts to see statistics</p>
                </div>
            `;
            return;
        }

        // Calculate stats
        const totalWorkouts = this.workoutHistory.length;
        const currentStreak = this.getCurrentStreak();
        
        // Workouts this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const workoutsThisWeek = this.workoutHistory.filter(workout => 
            new Date(workout.date) > weekAgo
        ).length;

        // Most frequent workout type
        const workoutCounts = {};
        this.workoutHistory.forEach(workout => {
            workoutCounts[workout.type] = (workoutCounts[workout.type] || 0) + 1;
        });
        
        const mostFrequent = Object.keys(workoutCounts).reduce((a, b) => 
            workoutCounts[a] > workoutCounts[b] ? a : b, ''
        );

        // Average rest days between workouts
        let avgRestDays = 0;
        if (this.workoutHistory.length > 1) {
            const sortedHistory = [...this.workoutHistory].sort((a, b) => 
                new Date(a.date) - new Date(b.date)
            );
            
            let totalRestDays = 0;
            for (let i = 1; i < sortedHistory.length; i++) {
                const prevDate = new Date(sortedHistory[i-1].date);
                const currDate = new Date(sortedHistory[i].date);
                const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
                totalRestDays += Math.max(0, daysDiff - 1);
            }
            avgRestDays = Math.round(totalRestDays / (sortedHistory.length - 1) * 10) / 10;
        }

        statsGrid.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${totalWorkouts}</span>
                <div class="stat-label">Total Workouts</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${currentStreak}</span>
                <div class="stat-label">Current Streak</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${workoutsThisWeek}</span>
                <div class="stat-label">This Week</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${mostFrequent || 'N/A'}</span>
                <div class="stat-label">Most Frequent</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${avgRestDays}</span>
                <div class="stat-label">Avg Rest Days</div>
            </div>
        `;
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all workout history? This cannot be undone.')) {
            this.workoutHistory = [];
            this.nextWorkoutIndex = 0;
            this.saveData();
            this.renderUI();
        }
    }

    saveData() {
        const data = {
            workoutTypes: this.workoutTypes,
            workoutHistory: this.workoutHistory,
            nextWorkoutIndex: this.nextWorkoutIndex,
            version: '1.0'
        };
        
        localStorage.setItem('trainingPlannerData', JSON.stringify(data));
    }

    loadData() {
        try {
            const saved = localStorage.getItem('trainingPlannerData');
            if (saved) {
                const data = JSON.parse(saved);
                this.workoutTypes = data.workoutTypes || [];
                this.workoutHistory = data.workoutHistory || [];
                this.nextWorkoutIndex = data.nextWorkoutIndex || 0;
                
                // Ensure nextWorkoutIndex is valid
                if (this.nextWorkoutIndex >= this.workoutTypes.length) {
                    this.nextWorkoutIndex = 0;
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Reset to defaults if data is corrupted
            this.workoutTypes = [];
            this.workoutHistory = [];
            this.nextWorkoutIndex = 0;
        }
    }

    // Export data for backup
    exportData() {
        const data = {
            workoutTypes: this.workoutTypes,
            workoutHistory: this.workoutHistory,
            nextWorkoutIndex: this.nextWorkoutIndex,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import data from backup
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.version && data.workoutTypes && data.workoutHistory) {
                    this.workoutTypes = data.workoutTypes;
                    this.workoutHistory = data.workoutHistory;
                    this.nextWorkoutIndex = data.nextWorkoutIndex || 0;
                    
                    this.saveData();
                    this.renderUI();
                    
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid backup file format.');
                }
            } catch (error) {
                alert('Error importing data. Please check the file format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.planner = new TrainingPlanner();
});

// Add CSS for mobile-optimized animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideInMobile {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutMobile {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
