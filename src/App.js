import React, { Component } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';


import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
class App extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      userMessage: '',
	  conversation: [],
      userId : new Date().getTime()
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
    }

    function isHTML(str) {
      var doc = new DOMParser().parseFromString(str, "text/html");
      return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
    }

    this.listenSocket.onmessage = event => {
      let response=JSON.parse(event.data.trim());
      if(response.userId === this.state.userId) {
          let message=response.data;
          if(isHTML(message)) {
              message='Some thing went wrong, please try again after some time.'
          }
          const msg = {
              text: message,
              user: 'ai',
          };
          this.setState({
              conversation: [...this.state.conversation, msg],
          });
      }
    }

    this.listenSocket.onclose = () => {
      this.startListenerWebSocketClient();
    }

  }
  startPublisherWebSocketClient() {
    this.publishSocket = new WebSocket("wss://reactbot-nodered-flow.herokuapp.com/public/messagereceive");

    this.publishSocket.onopen = () => {
      // on connecting, do nothing but log it to the console
    }



    this.publishSocket.onmessage = evt => {
      const message = JSON.parse(evt.data);
      this.addMessage(message);
    }

    this.publishSocket.onclose = () => {
      this.startPublisherWebSocketClient();
    }

  }
  submitMessage = messageString => {
    const message = { channelType: 'chatbot', message: messageString, userId: this.state.userId }
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
      return (<div key={`${className}-${i+1}`} className={`${className} chat-bubble`}>
        <span className="chat-content">{event.text}</span>
      </div>);
    } else {
     if(this.isJson(event.text)) {
       const items=JSON.parse(event.text);
        return (
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
    const message = { channelType: 'email', message: conversation, subject: 'Chat History', to:'lionelpannaisamy@gmail.com;tamilselvam.r@gmail.com;rk@softonics.in' };
    publisher.send(JSON.stringify(message));
  }
  render() {
      const responseFacebook = (response) => {
          console.log(response);
      }

      const responseGoogle = (response) => {
          console.log(response);
      }
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
              <div className="interior">
                <img className="mail-box" onClick={() => this.sendEmail(this.state.conversation, this.publishSocket)} src={mailIcon} title="Send Conversation"/>
                <a  href="#open-modal"><img className="mailId-box" src={mailIdIcon} title="Enter Your Mail"/></a>
              </div>
                  
              <div id="open-modal" className="modal-window">
                <div>
                <a href="#" title="Close" className="modal-close"><img className="close-icon" src={closeIcon}/></a>
                <form className="form">
	              <input type="email" className="form__field" placeholder="Your E-Mail Address" />
			          <button type="button" className="btn btn--primary btn--inside uppercase">Send</button>
			          <button type="button" className="btn btn--danger btn--inside uppercase">Close</button>
                </form>
                </div>
                </div>
              </div>
            <ScrollToBottom className="conversation-view ">

              <div  id={'chathistory'}>{chat}</div>
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
