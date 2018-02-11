const empty = () => [new Array(19), new Array(19), new Array(19), new Array(19), new Array(19)];

const bookingRef = firebase.database().ref().child('booking');

const data = ['9:00','9:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
const newColor = 'LightGray '

var selecting = [new Array(19), new Array(19), new Array(19), new Array(19), new Array(19)];


var vm = new Vue({
	el: '#app',
	data: {
		timeslot: data,
		startDay: moment().startOf('week').add(1, 'd').toDate(),
		selecting: empty(),
		loged: false,
		isAdmin: false,
		username: '',
		password: '',
		selectedUser: '',
		reason: '',
	},
	methods: {
		clickTimeslot: function(day, time) {
			if (this.loged) {
				if ((this.isAdmin && this.booked[day][time]) || (!this.isAdmin && !this.booked[day][time])) {
					if (this.selecting[day][time])
						this.$set(this.selecting[day], time, undefined)
					else {
						if (this.isAdmin)
							this.selecting = empty();
						this.$set(this.selecting[day], time, true)
					}
				}
			}
		},
		prevWeek: function() {
			this.startDay = moment(this.startDay).subtract(7,'d').toDate();
		},
		nextWeek: function() {
			this.startDay = moment(this.startDay).add(7,'d').toDate();
		},
		login: function() {
			firebase.auth().signInWithEmailAndPassword(this.username + '@qupital.com', this.password)
			.then((user) => {
				this.loged = true; 
				this.isAdmin = user.email == 'admin@qupital.com';
				this.username = ''; 
				this.password = '';
			})
			.catch(e => console.log(e.message));
		},
		logout: function() {
			firebase.auth().signOut()
			.then(()=>{
				this.loged = false;
				this.selecting = empty();
			})
		},
		reload: function(newStartDay) {
			if (newStartDay) {
				this.selecting = empty()
				const start = newStartDay.getTime();
				const end = moment(newStartDay).add(4,'d').valueOf();
				this.$bindAsArray('booking', firebase.database().ref().child('booking').orderByChild("date").startAt(start).endAt(end));
			} else {
				this.$unbind('booking');
			}
		},
		book: function() {
			if (this.selectedUser) {
				const user = this.selectedUser;
				const reason = this.reason;

				for (let i in this.selecting) {
					const date = moment(this.startDay).add(i,'d').valueOf()
					let start, end;
					for (let j in this.selecting[i]) {
						if (this.selecting[i][j]) {
							time = parseInt(j)
							if (start == undefined) {
								start = time;
								end = time;
							}
							else {
								if (time-end == 1) {
									end += 1;
								} else {
									bookingRef.push({date, start,end, user, reason})
									start = time;
									end = time;
								}
							}
						}
					}

					if (start !=undefined) 
						bookingRef.push({date, start,end, user, reason})
				}

			}
			this.selecting = empty();
			this.selectedUser = '';
			this.reason = '';
		},
		remove: function() {
			for (let i in this.selecting) {
				for (let j in this.selecting[i]) {
					if (this.selecting[i][j] == true) {
						// find the booking record
						let time = parseInt(j);
						let booking;
						for (let k in this.booking) {
							if (moment(this.booking[k].date).weekday()-1 == i) {
								if (time >= this.booking[k].start && time <= this.booking[k].end) {
									booking = this.booking[k];
									break;
								}
							}
						}

						// update
						if (booking.start == booking.end) 
							bookingRef.child(booking['.key']).remove();
						else if (time == booking.start) 
							bookingRef.child(booking['.key']).update({start: time + 1});
						else if (time == booking.end) 
							bookingRef.child(booking['.key']).update({end: time - 1});
						else {
							const {end, user, reason, date} = booking;
							const start = time + 1;

							bookingRef.child(booking['.key']).update({end: time - 1});
							bookingRef.push({date, start, end, user, reason});
						}

						this.reload(this.startDay);
						return;
					}
				}
			}
		}
	},
	computed: {
		booked: function() {
			let show = [[],[],[],[],[]];
			for (let i in this.booking) {
				const day = moment(this.booking[i].date).weekday()-1
				for (let j = this.booking[i].start ; j < this.booking[i].end + 1; j++) {
					show[day][j] = {style:{backgroundColor: this.userColor[this.booking[i].user]}, user: this.booking[i].user, reason: this.booking[i].reason}
				}
			}
			return show;
		},
		userColor: function() {
			let userColor = {}
			if (this.userList.length) {
				for (let i in this.userList) {
					userColor[this.userList[i]['.key']] = this.userList[i]['.value']
				}
			}
			return userColor
		},
		users: function() {
			return Object.keys(this.userColor).sort()
		},
		weekdays: function() {
			let arr = [];
			for (let i = 0; i < 5; i++) {
				arr.push(moment(this.startDay).add(i,'d').format('DD/MM'));
			}
			return arr;
		},
		weekString: function() {
			return moment(this.startDay).format('DD/MM') + ' - ' + moment(this.startDay).add(4,'d').format('DD/MM')
		},
		display: function() {
			let display = [[],[],[],[],[]];

			for (let i in this.booked) {
				for (let j in this.booked[i]) {
					display[i][j] = {};
					_.assign(display[i][j], this.booked[i][j]);
				}
			}

			for (let i in display) {
				for (let j in this.selecting[i]) {
					if (this.isAdmin) {
						if (this.selecting[i][j] == true) 
							display[i][j].style = {...display[i][j].style, color: 'Red'};
					} else {
						if (this.selecting[i][j] == true)
							display[i][j] = {style:{backgroundColor: newColor, color: 'Red'}, user: 'New'}
					}					
				}
			}
			
			return display
		},
	},
	watch: {
		startDay: function(newStartDay) {
			this.reload(newStartDay)
		}
	},
	firebase: function() {
		const start = this.startDay.getTime();
		const end = moment(this.startDay).add(4,'d').valueOf();
		return {
			booking: bookingRef.orderByChild("date").startAt(start).endAt(end),
			userList: firebase.database().ref().child('user')
		}
	}
})

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		vm.loged = true;
		vm.isAdmin = user.email == 'admin@qupital.com'
	} else {
		vm.loged = false
	}
});