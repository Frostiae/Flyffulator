import { useEffect } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';

function PlayerModel({ modelPath }) {
    const { scene, animations } = useGLTF(modelPath);
    const { actions, mixer } = useAnimations(animations, scene);
    useEffect(() => {
        if (actions) {
            const action = actions[Object.keys(actions)[0]];
            if (action) {
                action.play();
            }
        }

        return () => {
            if (mixer) {
                mixer.stopAllAction();
            }
        };
    }, [actions, mixer]);

    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                if (child.material.map) {
                    child.material.transparent = true;
                    child.material.alphaTest = 0.5;
                }
            }
        });
    }, [scene]);

    return (
        <primitive object={scene} />
    )
}

export default PlayerModel;
