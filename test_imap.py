import imaplib 
import email 
import os 
 
# Configuration 
IMAP_SERVER = "imap.ionos.de" 
EMAIL_USER = "invoice@askari-transport.de" 
EMAIL_PASS = "A7k9M2xP" 
 
def test_sync():
    try:
        # Connection set karein 
        print(f"Connecting to {IMAP_SERVER}...")
        mail = imaplib.IMAP4_SSL(IMAP_SERVER) 
        print("Logging in...")
        mail.login(EMAIL_USER, EMAIL_PASS) 
        mail.select("inbox") 
        
        # Unseen (na-parhi hui) emails search karein 
        print("Searching for UNSEEN emails...")
        status, data = mail.search(None, 'UNSEEN') 
        mail_ids = data[0].split() 
        
        print(f"Found {len(mail_ids)} unseen emails.")
        
        for m_id in mail_ids: 
            status, msg_data = mail.fetch(m_id, '(RFC822)') 
            raw_email = msg_data[0][1] 
            msg = email.message_from_bytes(raw_email) 
            
            subject = msg.get('Subject')
            print(f"Processing Email: {subject}")
        
            # Email ke parts check karein (Attachments ke liye) 
            for part in msg.walk(): 
                if part.get_content_maintype() == 'multipart': 
                    continue 
                if part.get('Content-Disposition') is None: 
                    continue 
        
                filename = part.get_filename() 
                if filename: 
                    print(f"Found Attachment: {filename}")
        
        mail.logout()
        print("Test completed successfully.")
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    test_sync()
