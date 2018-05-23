import Checkbox from '../components/Checkbox'
import Date from '../components/Date'
import DateTime from '../components/DateTime'
import Dropdown from '../components/Dropdown'
import Email from '../components/Email'
import FileUpload from '../components/FileUpload'
import Input from '../components/Input'
import InputArray from '../components/InputArray'
import Password from '../components/Password'
import Radio from '../components/Radio'
import SimpleDateTime from '../components/SimpleDateTime'
import Textarea from '../components/Textarea'
import VerificationCode from '../components/VerificationCode'

const isInputComponent = (type) => {
    switch (type) {
    case Checkbox:
    case Date:
    case DateTime:
    case Dropdown:
    case Email:
    case FileUpload:
    case Input:
    case InputArray:
    case Password:
    case Radio:
    case SimpleDateTime:
    case Textarea:
    case VerificationCode:
        return true
    default:
        return false
    }
}

export default isInputComponent
