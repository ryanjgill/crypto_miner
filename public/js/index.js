Vue.use(VueHighcharts);

var options = {
  colors: ["#7cb5ec", "#90ed7d", "#f7a35c", "#8085e9", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"],
	credits: false,
	chart: {
		style: {
			fontFamily: "Roboto",
      fontSize: '0.8em'
		},
		backgroundColor: '#272b30'
	},
  title: {
    text: ''
  },
  xAxis: {
		type: 'datetime',
		tickPixelInterval: 5000
	},
  yAxis: {
    allowDecimals: false,
		labels: {
			style: {
        fontSize: '1.2em',
        color: '#aaaaaa'
			}
		},
    title: {
      text: 'Temperature (°C)'
    },
    plotLines: [{
      value: 0,
      width: 1,
      color: '#808080'
    }]
  },
  tooltip: {
    valueSuffix: '°C',
		enabled: true
  },
  legend: {
    layout: 'horizontal',
    align: 'center',
    verticalAlign: 'top',
    borderWidth: 0,
		labelFormatter() {
			return this.name.toUpperCase().split('_').join(' ').split('TEMP').join(' ')
    },
    itemStyle: {
      color: '#aaaaaa'
    }
	},
	plotOptions: {
		series: {
			enableMouseTracking: true,
			marker: {
					enabled: false
			}
		}
	},
  series: [{
    name: 'room_temp',
    data: []
  }, {
    name: 'case_temp',
    data: []
  }, {
    name: 'radiator_temp',
    data: []
  }, {
    name: 'gpu_1_temp',
    data: []
  }, {
    name: 'gpu_2_temp',
    data: []
  }]
};

new Vue({
	el: '#dashboard',
	template: `
	<div>
		<div class="rig-name-and-rate readings">
			<div class="reading">
				<div>
					<label>Rig Name</label>
					<span>{{name}}</span>
				</div>
			</div>
			<div class="reading">
				<div>
					<label>Hash Rate</label>
					<span title="Megahashes per second">{{hashRate}}</span>
				</div>
			</div>
		</div>
		<div class="readings">
			<div class="reading">
				<div>
					<label>Room</label>
					<span>{{room_temp}}</span>
				</div>
			</div>
			<div class="reading">
				<div>
					<label>Case</label>
					<span>{{case_temp}}</span>
				</div>
			</div>
			<div class="reading">
				<div>
					<label>Radiator</label>
					<span>{{radiator_temp}}</span>
				</div>
			</div>
			<div class="reading">
				<div>
					<label>GPU 1</label>
					<span>{{gpu_1_temp}}</span>
				</div>
			</div>
			<div class="reading">
				<div>
					<label>GPU 2</label>
					<span>{{gpu_2_temp}}</span>
				</div>
			</div>
		</div>
		<div id="chart">
			<highcharts :options="options" ref="highcharts"></highcharts>
		</div>
	</div>
	`,
	data: {
		options: options,
		case_temp: '0',
		name: 'Gill',
		gpu_1_temp: '0',
    gpu_2_temp: '0',
    socket: null,
		radiator_temp: '0',
		room_temp: '0',
		hashRate: 0
	},
	computed: {
	},
	created() {
    this.socket = io();
		this.socket.on('lastReadings', this.handleLastReadings)
		this.socket.on('reading', this.handleReading)
  },
  methods: {
		handleLastReadings(data) {
			let chartData = data.reduce((series, reading, index) => {
				let ticks = new Date(reading.date).getTime()
				series['case_temps'].push([ticks, +reading.case_temp])
				series['gpu_1_temps'].push([ticks, +reading.gpu_1_temp])
				series['gpu_2_temps'].push([ticks, +reading.gpu_2_temp])
				series['radiator_temps'].push([ticks, +reading.radiator_temp])
				series['room_temps'].push([ticks, +reading.room_temp])
				return series
			}, {
				case_temps: [],
				gpu_1_temps: [],
				gpu_2_temps: [],
				radiator_temps: [],
				room_temps: []
			})

			this.options.series[0].data = chartData.room_temps.slice().reverse()
			this.options.series[1].data = chartData.case_temps.slice().reverse()
			this.options.series[2].data = chartData.radiator_temps.slice().reverse()
			this.options.series[3].data = chartData.gpu_1_temps.slice().reverse()
			this.options.series[4].data = chartData.gpu_2_temps.slice().reverse()
		},
    handleReading(data) {
      Object.keys(data).forEach(key => this.$data[key] = (+data[key]).toFixed(0))
      this.updateChart()
    },
    updateChart() {
      let series = this.$refs.highcharts.chart.series
      let ticks = new Date().getTime()
			series[0].addPoint([ticks, +this.$data.room_temp], false, true)
			series[1].addPoint([ticks, +this.$data.case_temp], false, true)
			series[2].addPoint([ticks, +this.$data.radiator_temp], false, true)
			series[3].addPoint([ticks, +this.$data.gpu_1_temp], false, true)
			series[4].addPoint([ticks, +this.$data.gpu_2_temp], true, true)
    }
  }
});
