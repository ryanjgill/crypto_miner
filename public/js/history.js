Vue.use(VueHighcharts);
var seriesNames = ['room_temp', 'case_temp', 'radiator_temp', 'gpu_1_temp', 'gpu_2_temp']
var colors = ["#7cb5ec", "#90ed7d", "#f7a35c", "#8085e9", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"]
var options = {
	colors: colors,
	credits: false,
	chart: {
		height: 'inherit',
		style: {
			fontFamily: "Roboto",
      fontSize: '0.8em'
		},
		backgroundColor: '#272b30',
		zoomType: 'x'
	},
	title: {
		text: 'Temperature history',
		style: {
			color: '#CCCCCC'
		}
	},
	subtitle: {
		text: document.ontouchstart === undefined ?
			'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
	},
	xAxis: {
		type: 'datetime'
	},
	yAxis: {
		title: {
			text: 'Temperature °C'
		}
	},
	legend: {
		enabled: false
	},
	plotOptions: {
		area: {
			fillColor: {
					linearGradient: {
							x1: 1,
							y1: 1,
							x2: 1,
							y2: 0
					},
					stops: [
							[0, window.colors[seriesNames.indexOf(window.type)]],
							[1, Highcharts.Color(window.colors[seriesNames.indexOf(window.type)]).setOpacity(0).get('rgba')]
					]
			},
			marker: {
					radius: 2
			},
			lineWidth: 1,
			states: {
					hover: {
							lineWidth: 1
					}
			},
			threshold: null
		}
	},
	series: [{
			type: 'area',
			name: 'Temps',
			data: []
	}]
}

new Vue({
	el: '#dashboard',
	template: `
	<div>
		<div id="chart">
			<highcharts :options="options" ref="highcharts"></highcharts>
		</div>
	</div>
	`,
	data: {
		options: options 
	},
	computed: {
	},
	created() {
		let color = this.options.colors[seriesNames.indexOf(window.type)]
		
		this.options.title.text = window.type.split('_').join(' ').toUpperCase() + 'S'
		this.options.title.style.color = color
		this.socket = io('/historicData', { query: `type=${window.type}`})
		this.socket.on('historicData', this.handleHistoricData)
  },
  methods: {
		handleHistoricData(data) {
			this.options.series[0].color = this.options.colors[seriesNames.indexOf(window.type)]
			this.options.series[0].name = window.type.split('_').join(' ')
			this.options.series[0].data = data.reverse()
		}
  }
});
