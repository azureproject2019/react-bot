import React, { Component } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import './App.css';
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userMessage: '',
	  conversation: []
    };

  }




  componentDidMount() {
    this.startListenerWebSocketClient();
    this.startPublisherWebSocketClient();
  }

  startListenerWebSocketClient() {
    this.listenSocket = new WebSocket("wss://azure2019.fred.sensetecnic.com/api/public/messagepublish"); //server publishes
    this.listenSocket.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log('connected')
    }

    this.listenSocket.onmessage = event => {
      // on receiving a message, add it to the list of messages
      let mockObj= JSON.stringify([ {
        "room___roomId": 12682,
        "room___roomTypeId": 1001,
        "room___hotelId": 3,
        "room___booked": 0,
        "hotel___hotelId": 3,
        "hotel___name": "Joe Mcclure",
        "hotel___city": "North Margaret",
        "hotel___country": "Afghanistan",
        "roomtype___roomTypeId": 1001,
        "roomtype___roomType": "Deluxe",
        "roomtype___price": 3750
      } ]);
      const msg = {
        text: event.data.trim(),
        //text:mockObj,
        user: 'ai',
      };
      this.setState({
        conversation: [...this.state.conversation, msg],
      });
      this.listenSocket.onclose = () => {
        console.log('disconnected');
        this.listenSocket=null;
        // automatically try to reconnect on connection loss
        //this.listenSocket =  new WebSocket("wss://azure2019.fred.sensetecnic.com/api/public/messagepublish");
        this.startListenerWebSocketClient();
      }
    }

  }
  startPublisherWebSocketClient() {
    this.publishSocket = new WebSocket("wss://azure2019.fred.sensetecnic.com/api/public/messagereceive");

    this.publishSocket.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log('connected')
    }



    this.publishSocket.onmessage = evt => {
      // on receiving a message, add it to the list of messages
      const message = JSON.parse(evt.data)
      this.addMessage(message)
    }

    this.publishSocket.onclose = () => {
      console.log('disconnected');
      this.publishSocket=null;
      // automatically try to reconnect on connection loss
      //this.publishSocket =  new WebSocket("wss://azure2019.fred.sensetecnic.com/api/public/messagereceive");
      this.startPublisherWebSocketClient();
    }

  }
  submitMessage = messageString => {
    // on submitting the ChatInput form, send the message, add it to the list and reset the input
    const message = { channelType: 'chatbot', message: messageString }
    this.publishSocket.send(JSON.stringify(message))
  }
  handleChange = event => {
    this.setState({ userMessage: event.target.value });
  };

  handleSubmit = event => {
    event.preventDefault();
    if (!this.state.userMessage.trim()) return;

    const msg = {
      text: this.state.userMessage,
      user: 'human',
    };

    this.setState({
      conversation: [...this.state.conversation, msg],
    });

    /*fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: this.state.userMessage,
      }),
    });*/

    this.submitMessage({
      message: this.state.userMessage,
    });

    this.setState({ userMessage: '' });
  };

  isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

  getContent(event) {
    if(event.user === 'human') {
      return event.text;
    } else {
      //let convertedstr=hparse(event.text.trim());
     if(this.isJson(event.text)) {
       const items=JSON.parse(event.text);
        return (
            <div className="card-container">
              {items.map((item) =>
                  <a className="card">
                    {Object.keys(item).map(function (key) {
                      return (
						  (<h6 className="room-detail">{key}<span>{item[key]}</span></h6>)
                      )
                  }
                  )}
                  </a>
              )
              }
            </div>
        );
     } else {
       return event.text;
     }
    }
  }

  render() {

    const ChatBubble = (event, i, className) => {
      return (
       <div key={`${className}-${i}`} className={`${className} chat-bubble`}>
          <span className="chat-content">{this.getContent(event)}</span>
        </div>
      );
    };

    const chat = this.state.conversation.map((e, index) =>
      ChatBubble(e, index, e.user)
    );
    const mailIcon=require('./icons8-send-mail-100.png');
    return (
        <div>
          <div className="chat-window">
            <div className="chat-heading">
              <h1 className="animate-chat">React Chatbot</h1>
              <img className="mail-box" src={mailIcon} title="Send Convo"/>
            </div>
            <ScrollToBottom className="conversation-view ">

              <p>{chat}</p>
              {/* {
   "room___roomId": 12682,
   "room___roomTypeId": 1001,
   "room___hotelId": 3,
   "room___booked": 0,
   "hotel___hotelId": 3,
   "hotel___name": "Joe Mcclure",
   "hotel___city": "North Margaret",
   "hotel___country": "Afghanistan",
   "roomtype___roomTypeId": 1001,
   "roomtype___roomType": "Deluxe",
   "roomtype___price": 3750
 } */}

              {/*------------------------- loading indicator -----------*/}
              <div className="ticontainer">
                <div className="tiblock">
                  <div className="tidot"></div>
                  <div className="tidot"></div>
                  <div className="tidot"></div>
                </div>
              </div> 
			  </ScrollToBottom> 
              <form onSubmit={this.handleSubmit}>
              <input
                  value={this.state.userMessage}
                  onInput={this.handleChange}
                  className="css-input"
                  type="text"
                  autoFocus
                  placeholder="Type your message and hit Enter to send"    />
            </form>
        </div>
		</div>
    );
  }
}
export default App;
