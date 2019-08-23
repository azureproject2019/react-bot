import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ScrollToBottom from 'react-scroll-to-bottom';
import SwipeableViews from 'react-swipeable-views';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';

import 'bootstrap/dist/css/bootstrap.min.css';
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
    this.listenSocket = new WebSocket("wss://reactbot-nodered-flow.herokuapp.com/public/messagepublish"); //server publishes
    this.listenSocket.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log('connected')
    }

    function isHTML(str) {
      var doc = new DOMParser().parseFromString(str, "text/html");
      return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
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

      let message='';

      if(isHTML(event.data.trim())) {
        message='Some thing went wrong, please try again after some time.'
      } else {
        message=event.data.trim();
      }
      const msg = {
        text: message,
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
    this.publishSocket = new WebSocket("wss://reactbot-nodered-flow.herokuapp.com/public/messagereceive");

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

  getContent(event, className, i) {
    if(event.user === 'human') {
      return (<div key={`${className}-${i}`} className={`${className} chat-bubble`}>
        <span className="chat-content">{event.text}</span>
      </div>);
    } else {
      //let convertedstr=hparse(event.text.trim());
     if(this.isJson(event.text)) {
       const items=JSON.parse(event.text);
        return (
          // <SwipeableViews enableMouseEvents className="card-container">
          //     {items.map((item) =>
          //         <a className="card">
          //           {Object.keys(item).map(function (key) {
          //             return (
					// 	  (<h6 className="room-detail">{key}<span>{item[key]}</span></h6>)
          //             )
          //         }
          //         )}
          //         </a>
          //     )
          //     }
          //   </SwipeableViews>
            <div className="card-container">
              {items.map((item) =>
                  <a className="card">
                    {Object.keys(item).map(function (key) {
                      return (
						  (<div><h6 className="room-detail">{key}</h6><span className="room-response">{item[key]}</span></div>)
                      )
                  }
                  )}
                  </a>
              )
              }
            </div>
        );
     } else {
       return (<div key={`${className}-${i}`} className={`${className} chat-bubble`}>
         <span className="chat-content">{event.text}</span>
       </div>);
     }
    }
  }

  sendEmail(conversation, publisher) {

    //ReactDOM.findDOMNode().innerHTML
    const message = { channelType: 'email', message: conversation, subject: 'Chat History', to:'lionelpannaisamy@gmail.com;tamilselvam.r@gmail.com;rk@softonics.in' };
    console.log(JSON.stringify(message));
    publisher.send(JSON.stringify(message));
  }
  render() {

    const ChatBubble = (event, i, className) => {
      return (
          <div>{this.getContent(event, className, i)}</div>

      );
    };

    const chat = this.state.conversation.map((e, index) =>
      ChatBubble(e, index, e.user)
    );
    const mailIcon=require('./icons8-send-mail-100.png');
    const closeIcon=require('./error.png');
    const mailIdIcon=require('./icons8-send-mail-100 (1).png')
    return (
        <div>
          <div className="chat-window">
            <div className="chat-heading">
              <h1 className="animate-chat">React Chatbot</h1>
              {/*   */}
              <div className="interior">
                
                <img className="mail-box" onClick={() => this.sendEmail(this.state.conversation, this.publishSocket)} src={mailIcon} title="Send Conversation"/>
                <a  href="#open-modal"><img className="mailId-box" src={mailIdIcon} title="Enter Your Mail"/></a>
              </div>
                  
              <div id="open-modal" class="modal-window">
                <div>
                <a href="#" title="Close" class="modal-close"><img className="close-icon" src={closeIcon}/></a>
                <form class="form">
	              <input type="email" class="form__field" placeholder="Your E-Mail Address" />
			          <button type="button" class="btn btn--primary btn--inside uppercase">Send</button>
			          <button type="button" class="btn btn--danger btn--inside uppercase">Close</button>
                </form>
                </div>
                </div>
              </div>
            <ScrollToBottom className="conversation-view ">

              <p  id={'chathistory'}>{chat}</p>
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
