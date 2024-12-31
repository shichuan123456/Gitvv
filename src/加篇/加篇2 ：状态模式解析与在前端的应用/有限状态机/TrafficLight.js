// 定义交通灯的状态  
const TrafficLightStates = {  
    RED: 'red',  
    YELLOW: 'yellow',  
    GREEN: 'green'  
  };  
    
  // 定义状态转换函数  
  function transitionToRed(light) {  
    light.state = TrafficLightStates.RED;  
    console.log('交通灯变为红色');  
  }  
    
  function transitionToYellow(light) {  
    light.state = TrafficLightStates.YELLOW;  
    console.log('交通灯变为黄色');  
  }  
    
  function transitionToGreen(light) {  
    light.state = TrafficLightStates.GREEN;  
    console.log('交通灯变为绿色');  
  }  
    
  // 根据当前状态和计时器来转换状态  
  function changeLightState(light) {  
    switch (light.state) {  
      case TrafficLightStates.RED:  
        setTimeout(() => transitionToGreen(light), 3000); // 红灯持续3秒后变绿灯  
        break;  
      case TrafficLightStates.GREEN:  
        setTimeout(() => transitionToYellow(light), 5000); // 绿灯持续5秒后变黄灯  
        break;  
      case TrafficLightStates.YELLOW:  
        setTimeout(() => transitionToRed(light), 2000); // 黄灯持续2秒后变红灯  
        break;  
    }  
  }
  class TrafficLight {  
    constructor() {  
      this.state = TrafficLightStates.RED;  
    }  
    
    // 开始交通灯的状态转换循环  
    start() {  
      setInterval(() => changeLightState(this), 1000); // 每秒检查一次是否需要转换状态  
    }  
  }
  // trafficlight=new TrafficLight;
  // trafficlight.start()