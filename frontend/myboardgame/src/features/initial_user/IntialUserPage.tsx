import React, { useState, useContext } from 'react';
import { CheckCircle, User, Phone, FileText, Award, Coins } from 'lucide-react';
import serviceApiUser from '../../shared/api/services/user.service';
import { InitialUserModel } from '../../entities/InitUserModel';
import { UserEntity } from '../../entities/UserEntity';
import { ContextLocalData, LocalDataInterface } from '../../app/providers/LocalDataContext';
import { useNavigate } from 'react-router-dom';



// Các bước trong quy trình
const STEPS = [
    {
        id: 'username',
        title: 'Cập nhật tên trong game',
        icon: User,
        description: 'Hãy chọn một tên người chơi độc đáo',
        placeholder: 'Nhập tên trong game...',
        // apiCall: (value: string) => serviceApiUser.updateUsername(value)
    },
    {
        id: 'avatarUrl',
        title: 'Cập nhật avatar',
        icon: User,
        description: 'Chọn ảnh đại diện cho tài khoản của bạn',
        placeholder: 'Dán URL avatar...',
        // apiCall: (value: string) => serviceApiUser.updateAvatar(value)
    },
    {
        id: 'phone',
        title: 'Cập nhật số điện thoại',
        icon: Phone,
        description: 'Để bảo mật và khôi phục tài khoản',
        placeholder: 'Nhập số điện thoại...',
        // apiCall: (value: string) => serviceApiUser.updatePhone(value)
    },
    {
        id: 'bio',
        title: 'Viết tiểu sử',
        icon: FileText,
        description: 'Giới thiệu bản thân với cộng đồng',
        placeholder: 'Nhập tiểu sử của bạn...',
        // apiCall: (value: string) => serviceApiUser.updateBio(value)
    }
];


const MyInitialUserPage = () => {
    const localDataContext = useContext<LocalDataInterface | null>(ContextLocalData);
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(0);
    const [userValue, setUserValue] = useState<InitialUserModel>({
        username: '',
        avatarUrl: '',
        phone: '',
        bio: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [updateUserResult, setUpdateUserResult] = useState<UserEntity | null>(null);

    const handleStepSubmit = async () => {
        if (currentStep >= STEPS.length) return;

        const step = STEPS[currentStep];

        const key = step.id as keyof InitialUserModel;
        const value = userValue[key];

        if (!value.trim()) {
            alert('Vui lòng nhập thông tin!');
            return;
        }

        setIsLoading(true);

        try {
            // Chuyển sang bước tiếp theo
            if (currentStep === STEPS.length - 1) {
                const result = await serviceApiUser.updateUser(
                    localDataContext!.user.id,
                    userValue
                )
                console.log('userValue:', userValue);
                if (result.success) {
                    setUpdateUserResult((prev) => result.data)
                    console.log('updateUserResult result:', result);

                    setShowStatsModal(true);
                }
            } else {
                setCurrentStep(prev => prev + 1);
            }
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            alert('Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (stepId: string, value: string) => {
        setUserValue(prev => ({
            ...prev,
            [stepId]: value
        }));
    };

    const handleSkip = () => {
        if (currentStep === STEPS.length - 1) {
            setShowStatsModal(true);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBeginGame = () => {
        setShowStatsModal(false);
        navigate("/home", { replace: true });
    }
    return (
        <>
            <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-br from-gray-900 to-black p-4">
                <div className="w-full max-w-2xl">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            {STEPS.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${index < currentStep
                                            ? 'bg-green-500 border-green-500'
                                            : index === currentStep
                                                ? 'bg-blue-500 border-blue-500'
                                                : 'bg-gray-800 border-gray-600'
                                            }`}>
                                            {index < currentStep ? (
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            ) : (
                                                <step.icon className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                        <span className="text-xs mt-2 text-gray-300 text-center hidden md:block">
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div className={`flex-1 h-1 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-gray-700'
                                            }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                    </div>

                    {/* Step Content */}
                    <div className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
                        {currentStep < STEPS.length && (
                            <>
                                <div className="flex items-center mb-6">

                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {STEPS[currentStep].title}
                                        </h2>
                                        <p className="text-gray-400">
                                            {STEPS[currentStep].description}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={userValue[STEPS[currentStep].id as keyof InitialUserModel]}
                                        onChange={(e) => handleInputChange(STEPS[currentStep].id, e.target.value)}
                                        placeholder={STEPS[currentStep].placeholder}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        disabled={isLoading}
                                        onKeyDown={(e) => e.key === 'Enter' && handleStepSubmit()}
                                    />

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={handleStepSubmit}
                                            disabled={isLoading}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                'Tiếp tục'
                                            )}
                                        </button>

                                        <button
                                            onClick={handleSkip}
                                            disabled={isLoading}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition duration-200 disabled:opacity-50"
                                        >
                                            Bỏ qua
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Stats Modal */}
                    {showStatsModal && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                            <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fadeIn">
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Award className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        Chào mừng đến với game!
                                    </h3>
                                    <p className="text-gray-400">
                                        Bạn đã hoàn thành thiết lập tài khoản
                                    </p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="bg-gray-900 rounded-xl p-4">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                                                <Award className="w-6 h-6 text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-gray-400 text-sm">Chiến lực</div>
                                                <div className="text-2xl font-bold text-white">
                                                    {updateUserResult?.experiencePoints}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-900 rounded-xl p-4">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
                                                <Coins className="w-6 h-6 text-yellow-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-gray-400 text-sm">Vàng tích lũy</div>
                                                <div className="text-2xl font-bold text-white">
                                                    {updateUserResult?.gold}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBeginGame}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
                                >
                                    Bắt đầu chơi ngay
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </>
    );
};

export default MyInitialUserPage;